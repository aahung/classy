import * as fs from "fs-extra";
import Log from "./util/Log";

export class Config {

    public static getInstance(configName?: string): Config {
        if (Config.instance === null) {
            const c = new Config();
            Config.instance = c;
        }
        return Config.instance;
    }

    protected static instance: Config = null;

    private config: any;

    private constructor() {
        // should not be called by clients but typescript does not allow private constructors
        try {
            this.config = {
                name: process.env.NAME,
                org: process.env.ORG,
                adminUser: process.env.ADMIN_USER,
                dockerId: process.env.DOCKER_ID,
                workspace: process.env.WORKSPACE,
                oracleRepo: process.env.ORACLE_REPO,
                postback: Boolean(process.env.POSTBACK),
                persistDir: process.env.PERSIST_DIR,
                port: Number(process.env.PORT),
                kind: process.env.KIND,
                timeout: Number(process.env.TIMEOUT),
                botName: process.env.BOT_NAME,
                githubOrgToken: process.env.GHT_STUDENT_ORG,
                githubOracleToken: process.env.GHT_ORACLE,
                sslCertPath: process.env.SSL_CERT_PATH,
                sslKeyPath: process.env.SSL_KEY_PATH,
                classPortalHost: process.env.CP_HOST,
                classPortalPort: process.env.CP_PORT,
                graderHost: process.env.GRADER_HOST,
                graderPort: process.env.GRADER_PORT,
                mongoUrl: process.env.DB_URL,
            };
        } catch (err) {
            Log.error("Config::<init> - fatal error reading configuration file: " + err);
        }
    }

    public getProp(prop: string): any {
        if (typeof this.config[prop] === "undefined") {
            Log.error("Config::getProp( " + prop + " ) - property is undefined; you probably want this in your config file.");
        } else if (this.config[prop] === null) {
            Log.error("Config::getProp( " + prop + " ) - property is null");
        } else {
            return this.config[prop];
        }
        return null;
    }

}