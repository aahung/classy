import {expect} from "chai";
import "mocha";
import * as restify from "restify";
import * as request from "supertest";

import Config, {ConfigKey} from "../../../../common/Config";
import Log from "../../../../common/Log";
import {ConfigTransportPayload, Payload, TeamFormationTransport} from "../../../../common/types/PortalTypes";
import {DatabaseController} from "../../src/controllers/DatabaseController";
import {RepositoryController} from "../../src/controllers/RepositoryController";
import BackendServer from "../../src/server/BackendServer";

import {Test} from "../GlobalSpec";

describe('General Routes', function() {

    let app: restify.Server = null;

    let server: BackendServer = null;

    before(async () => {
        Log.test('GeneralRoutes::before - start');
        await Test.suiteBefore('General Routes');
        await Test.prepareAll();

        // NOTE: need to start up server WITHOUT HTTPS for testing or strange errors crop up
        DatabaseController.getInstance(); // just get this done at the start
        server = new BackendServer(false);

        try {
            await server.start(); // .then(function() {
            Log.test('GeneralRoutes::before - server started');
            app = server.getServer();
        } catch (err) {
            Log.test('GeneralRoutes::before - server might already be started: ' + err);
        }
    });

    after(function() {
        Log.test('GeneralRoutes::after - start');
        Test.suiteAfter('General Routes');
        return server.stop();
    });

    it('Should be able to get config details', async function() {

        let response = null;
        let body: ConfigTransportPayload;
        const url = '/portal/config';
        try {
            response = await request(app).get(url);
            body = response.body;
        } catch (err) {
            Log.test('ERROR: ' + err);
        }
        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(200);
        expect(body.success).to.not.be.undefined;
        expect(body.success.org).to.not.be.undefined;
        expect(body.success.org).to.equal(Config.getInstance().getProp(ConfigKey.org)); // valid .org usage
        expect(body.success.name).to.equal(Config.getInstance().getProp(ConfigKey.name));
    });

    it('Should be able to get a person.', async function() {
        const dc: DatabaseController = DatabaseController.getInstance();

        // get user
        const auth = await dc.getAuth(Test.USER1.id);
        expect(auth).to.not.be.null;

        let response = null;
        let body: Payload;
        const url = '/portal/person';
        try {
            Log.test('Making request');
            response = await request(app).get(url).set('user', auth.personId).set('token', auth.token);
            Log.test('Response received');
            body = response.body;
        } catch (err) {
            Log.test('ERROR: ' + err);
        }

        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(200);
        expect(body.success).to.not.be.undefined;
        expect(body.success.id).to.equal(Test.USER1.id);
        expect(body.success.githubId).to.equal(Test.USER1.github);
    });

    it('Should not be able to get a person without the right token.', async function() {
        const dc: DatabaseController = DatabaseController.getInstance();

        // get user
        const auth = await dc.getAuth(Test.USER1.id);
        expect(auth).to.not.be.null;

        let response = null;
        let body: Payload;
        const url = '/portal/person';
        try {
            Log.test('Making request');
            response = await request(app).get(url).set('user', auth.personId).set('token', Test.FAKETOKEN);
            Log.test('Response received');
            body = response.body;
        } catch (err) {
            Log.test('ERROR: ' + err);
        }

        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(400);
        expect(body.success).to.be.undefined;
        expect(body.failure).to.not.be.undefined;
    });

    it('Should be able to get a released grade for a user.', async function() {
        const dc: DatabaseController = DatabaseController.getInstance();

        // get user
        const auth = await dc.getAuth(Test.USER1.id);
        expect(auth).to.not.be.null;

        // prepare deliverables
        let deliv = Test.getDeliverable(Test.DELIVID1);
        deliv.gradesReleased = true;
        await dc.writeDeliverable(deliv);
        deliv = Test.getDeliverable(Test.DELIVID2);
        deliv.gradesReleased = true;
        await dc.writeDeliverable(deliv);

        let response = null;
        let body: Payload;
        const url = '/portal/grades';
        try {
            Log.test('Making request');
            response = await request(app).get(url).set('user', auth.personId).set('token', auth.token);
            Log.test('Response received');
            body = response.body;
        } catch (err) {
            Log.test('ERROR: ' + err);
        }

        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(200);
        expect(body.success).to.not.be.undefined;
        expect(body.success.length).to.equal(2);
        expect(body.success[0].delivId).to.equal(Test.DELIVID1);
        expect(body.success[0].score).to.equal(100);
        expect(body.success[1].delivId).to.equal(Test.DELIVID2);
        expect(body.success[1].score).to.equal(null);
    });

    it('Should not be able to get get grades without a valid token.', async function() {
        const dc: DatabaseController = DatabaseController.getInstance();

        // get user
        const auth = await dc.getAuth(Test.USER1.id);
        expect(auth).to.not.be.null;

        let response = null;
        let body: Payload;
        const url = '/portal/grades';
        try {
            Log.test('Making request');
            response = await request(app).get(url).set('user', auth.personId).set('token', 'INVALIDTOKEN');
            Log.test('Response received');
            body = response.body;
        } catch (err) {
            Log.test('ERROR: ' + err);
        }

        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(400);
        expect(body.success).to.be.undefined;
        expect(body.failure).to.not.be.undefined;
        expect(body.failure.message).to.equal('Invalid credentials');
    });

    it('Should be able to get get the teams for a user.', async function() {
        const dc: DatabaseController = DatabaseController.getInstance();

        // get user
        const auth = await dc.getAuth(Test.USER1.id);
        expect(auth).to.not.be.null;

        let response = null;
        let body: Payload;
        const url = '/portal/teams';
        try {
            Log.test('Making request');
            response = await request(app).get(url).set('user', auth.personId).set('token', auth.token);
            Log.test('Response received');
            body = response.body;
        } catch (err) {
            Log.test('ERROR: ' + err);
        }

        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(200);
        expect(body.success).to.not.be.undefined;
        expect(body.success.length).to.equal(2);
        expect(body.success[0].delivId).to.equal(Test.DELIVID0);
        expect(body.success[0].id).to.equal(Test.TEAMNAME1);
    });

    it('Should not be able to get get teams without a valid token.', async function() {
        const dc: DatabaseController = DatabaseController.getInstance();

        // get user
        const auth = await dc.getAuth(Test.USER1.id);
        expect(auth).to.not.be.null;

        let response = null;
        let body: Payload;
        const url = '/portal/teams';
        try {
            Log.test('Making request');
            response = await request(app).get(url).set('user', auth.personId).set('token', 'INVALIDTOKEN');
            Log.test('Response received');
            body = response.body;
        } catch (err) {
            Log.test('ERROR: ' + err);
        }

        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(400);
        expect(body.success).to.be.undefined;
        expect(body.failure).to.not.be.undefined;
        expect(body.failure.message).to.equal('Invalid credentials');
    });

    // bad form (already on team)
    it('Should not be able to form an invalid team.', async function() {
        const dc: DatabaseController = DatabaseController.getInstance();

        // get user
        const auth = await dc.getAuth(Test.USER1.id);
        expect(auth).to.not.be.null;

        let response = null;
        let body: Payload;
        const url = '/portal/team';
        try {
            Log.test('Making request');
            const teamReq: TeamFormationTransport = {
                delivId:   Test.DELIVID0,
                githubIds: [Test.USER1.github]
            };
            // this is invalid because the person is already on a d0 team
            response = await request(app).post(url).send(teamReq).set('user', auth.personId).set('token', auth.token);
            Log.test('Response received');
            body = response.body;
        } catch (err) {
            Log.test('ERROR: ' + err);
        }

        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(400);
        expect(body.success).to.be.undefined;
        expect(body.failure).to.not.be.undefined;
        expect(body.failure.message).to.equal('User is already on a team for this deliverable ( user1id is on t_d0_user1id_user2id ).');

        try {
            Log.test('Making request');
            const teamReq: TeamFormationTransport = {
                delivId:   Test.DELIVIDPROJ,
                githubIds: [Test.USER5.github, Test.USER5.github]
            };
            // this is invalid because the person id is used more than once
            response = await request(app).post(url).send(teamReq).set('user', auth.personId).set('token', auth.token);
            Log.test('Response received');
            body = response.body;
        } catch (err) {
            Log.test('ERROR: ' + err);
        }

        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(400);
        expect(body.success).to.be.undefined;
        expect(body.failure).to.not.be.undefined;
        expect(body.failure.message).to.equal("Team not created; duplicate team members specified.");

    });

    // bad form (forming for someone else)
    it('Should not be able to form a team they are not going to be a member of.', async function() {
        const dc: DatabaseController = DatabaseController.getInstance();

        // get user
        const auth = await dc.getAuth(Test.USER1.id);
        expect(auth).to.not.be.null;

        let response = null;
        let body: Payload;
        const url = '/portal/team';
        try {
            Log.test('Making request');
            const teamReq: TeamFormationTransport = {
                delivId:   Test.DELIVID0,
                githubIds: [Test.USER2.github]
            };
            // this is invalid because the person is not going to be on the resulting team
            response = await request(app).post(url).send(teamReq).set('user', auth.personId).set('token', auth.token);
            Log.test('Response received');
            body = response.body;
        } catch (err) {
            Log.test('ERROR: ' + err);
        }

        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(400);
        expect(body.success).to.be.undefined;
        expect(body.failure).to.not.be.undefined;
        expect(body.failure.message).to.equal('Users cannot form teams they are not going to join.');
    });

    // good form
    it('Should be able to form a valid team.', async function() {
        const dc: DatabaseController = DatabaseController.getInstance();

        // get user
        const auth = await dc.getAuth(Test.USER1.id);
        expect(auth).to.not.be.null;

        let response = null;
        let body: Payload;
        const url = '/portal/team';
        try {
            Log.test('Making request');
            const teamReq: TeamFormationTransport = {
                delivId:   Test.DELIVIDPROJ,
                githubIds: [Test.USER1.github, Test.USER2.github]
            };
            // this is invalid because the person is already on a d0 team
            response = await request(app).post(url).send(teamReq).set('user', auth.personId).set('token', auth.token);
            body = response.body;
            Log.test('Response received: ' + body);
        } catch (err) {
            Log.test('ERROR: ' + err);
        }

        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(200);
        expect(body.failure).to.be.undefined;
        expect(body.success).to.not.be.undefined;
        expect(body.success[0].id).to.be.an("string");
    });

    it('Should be able to get get the repos for a user.', async function() {
        const dc: DatabaseController = DatabaseController.getInstance();

        // get user
        const auth = await dc.getAuth(Test.USER1.id);
        expect(auth).to.not.be.null;

        let response = null;
        let body: Payload;
        const url = '/portal/repos';
        let ex = null;
        try {
            Log.test('Making request');
            response = await request(app).get(url).set('user', auth.personId).set('token', auth.token);
            body = response.body;
            Log.test('First response received: ' + body);
        } catch (err) {
            Log.test('ERROR: ' + err);
            ex = err;
        }

        // there should be no repos
        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(200);
        expect(ex).to.be.null;
        expect(body.success).to.not.be.undefined;
        expect(body.success.length).to.equal(0);

        // create a team, but don't release it
        const deliv = await dc.getDeliverable(Test.DELIVIDPROJ);
        const team = await dc.getTeam('t_project_user1gh_user2gh');
        const rc = new RepositoryController();
        const repo = await rc.createRepository('t_project_user1gh_user2gh', deliv, [team], {});

        ex = null;
        try {
            Log.test('Making request');
            response = await request(app).get(url).set('user', auth.personId).set('token', auth.token);
            body = response.body;
            Log.test('Second response received: ' + body);
        } catch (err) {
            Log.test('ERROR: ' + err);
            ex = err;
        }

        // there should be no repos
        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(200);
        expect(ex).to.be.null;
        expect(body.success).to.not.be.undefined;
        expect(body.success.length).to.equal(0);

        // now simulate the repo being released
        repo.URL = 'https://provisioned!';
        await dc.writeRepository(repo);

        ex = null;
        try {
            Log.test('Making request');
            response = await request(app).get(url).set('user', auth.personId).set('token', auth.token);
            body = response.body;
            Log.test('Third response received: ' + body);
        } catch (err) {
            Log.test('ERROR: ' + err);
            ex = err;
        }

        // there should be one repos
        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(200);
        expect(ex).to.be.null;
        expect(body.success).to.not.be.undefined;
        expect(body.success.length).to.equal(1);
    });

    it('Should not be able to get get the repos with an invalid token.', async function() {
        const dc: DatabaseController = DatabaseController.getInstance();

        // get user
        const auth = await dc.getAuth(Test.USER1.id);
        expect(auth).to.not.be.null;

        let response = null;
        let body: Payload;
        const url = '/portal/repos';
        let ex = null;
        try {
            Log.test('Making request');
            response = await request(app).get(url).set('user', auth.personId).set('token', Test.FAKETOKEN);
            body = response.body;
            Log.test('First response received: ' + body);
        } catch (err) {
            Log.test('ERROR: ' + err);
            ex = err;
        }

        // there should be an error
        Log.test(response.status + " -> " + JSON.stringify(body));
        expect(response.status).to.equal(400);
        expect(body.success).to.be.undefined;
        expect(ex).to.be.null;
        expect(body.failure.message).to.be.an('string');
    });

});
