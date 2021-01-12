
import * as fs from "fs";
import * as nconf from "nconf";
import * as process from "process";
import * as logger from "winston";

export class Config {

    private static initialized: boolean = false;
    private static appConf: nconf.Provider;
    public static confFilePath: string;
    private static reloadTimer: NodeJS.Timer;

    private static loadConfig(confPath: string, appName: string, appVersion: string, env: string): Promise<void> {
        return new Promise((resolve) => {
            if (Config.initialized) {
                logger.info('Now reloading configuration from ' + Config.confFilePath);
                Config.appConf = nconf.file({ file: Config.confFilePath }).argv().env();
            } else {
                // Locate configuration file
                Config.confFilePath = confPath + '/' + appName + '-v' + appVersion + '/' + env + '/' + 'config.json';
                logger.info('App configuration file full path [conf files path + application name and version + environment name] : ' + Config.confFilePath);
                if (fs.existsSync(Config.confFilePath) === false) {
                    logger.warn('Could not find configuration file at ' + Config.confFilePath + '. Trying to fall back to some other file ([conf files path + application name and version])');
                    Config.confFilePath = confPath + '/' + appName + '-v' + appVersion + '/' + 'config.json';
                    if (fs.existsSync(Config.confFilePath) === false) {
                        logger.warn('Could not find configuration file at ' + Config.confFilePath + '. Trying to fall back to some other file ([conf files path])');
                        Config.confFilePath = confPath + '/' + 'config.json';
                        if (fs.existsSync(Config.confFilePath) === false) {
                            throw new Error('Could not find any suitable configuration file at ' + Config.confFilePath + ' either');
                        }
                    }
                }
                // Define nconf precedence rule
                Config.appConf = nconf.file({ file: Config.confFilePath }).argv().env();
                logger.info('App configuration loaded from ' + Config.confFilePath);
            }
            resolve();
        });
    }

    public static init(options?: ConfigOptions): Promise<void> {
        logger.info('Starting application configuration init');
        let resolvedAppName: string, resolvedMajorVersion: string, resolvedAppEnv: string, resolvedAppConfigPath: string;

        // Resolve application name and version first
        let pjsonPath: string;
        if (options && options.packageDotJsonPath) {
            pjsonPath = options.packageDotJsonPath;
        } else {
            pjsonPath = process.cwd() + '/package.json';
        }
        const pjsonResolved = fs.existsSync(pjsonPath);
        if (pjsonResolved) {
            logger.info('package.json file located at : ' + pjsonPath);
            const packageDotJson = require(`${pjsonPath}`);
            resolvedAppName = packageDotJson.name;
            logger.info('application name from package.json : ' + resolvedAppName);
            if (Config.isAppScoped(resolvedAppName) && options && options.stripScope) {
                resolvedAppName = Config.stripAppScope(resolvedAppName);
                logger.info(`application name stripped from scope : ${resolvedAppName}`);
            }
            resolvedMajorVersion = packageDotJson.version.charAt(0);
            logger.info('major version from package.json : ' + resolvedMajorVersion);
        } else {
            logger.info("will work without package.json file");
            if (!options) {
                throw new Error("Cannot work without either a package.json file or an options object");
            }
            if (!options.appName) {
                throw new Error("Since no package.json fle provided, cannot work without an application name in the options");
            }
            if (!options.appVersion) {
                throw new Error("Since no package.json fle provided, cannot work without an application version in the options");
            }
            resolvedAppName = options.appName;
            if (Config.isAppScoped(resolvedAppName) && options.stripScope) {
                resolvedAppName = Config.stripAppScope(resolvedAppName);
                logger.info(`application name stripped from scope : ${resolvedAppName}`);
            }
            logger.info('application name from options : ' + resolvedAppName);
            resolvedMajorVersion = options.appVersion.charAt[0];
            logger.info('major version from options : ' + resolvedMajorVersion);
        }

        // Then locate and load a config file
        nconf.argv().env();
        if (options && options.appConfigPath) {
            resolvedAppConfigPath = options.appConfigPath;
        } else {
            resolvedAppConfigPath = nconf.get('APP_CONF_PATH');
        }
        if (!resolvedAppConfigPath || resolvedAppConfigPath == null) {
            throw new Error("Please either provide an options object with property 'appConfigPath' filled in or an APP_CONF_PATH environment variable");
        }
        logger.info('resolved configuration file path : ' + resolvedAppConfigPath);
        if (options && options.appEnv) {
            resolvedAppEnv = options.appEnv;
        } else {
            resolvedAppEnv = nconf.get('APP_ENV');
        }
        if (!resolvedAppEnv || resolvedAppEnv == null) {
            throw new Error("Please either provide an options object with property 'appEnv' filled in or an APP_ENV environment variable");
        }
        logger.info('resolved app environment : ' + resolvedAppEnv);

        // Load configuration file
        return Config.loadConfig(resolvedAppConfigPath, resolvedAppName, resolvedMajorVersion, resolvedAppEnv)
            .then(() => {
                // Have the config to reload from time to time
                const reloadDelay: number = Config.appConf.get('confReloadDelay') != null ? Number(Config.appConf.get('confReloadDelay')) : 5 * 60 * 1000; // 5 minutes
                if (reloadDelay > 0) {
                    logger.info('Configuration reload delay set to ' + reloadDelay);
                    Config.reloadTimer = global.setInterval(() => Config.loadConfig(resolvedAppConfigPath, resolvedAppName, resolvedMajorVersion, resolvedAppEnv), reloadDelay);
                }
                Config.initialized = true;
                process.on("SIGINT", () => {
                    clearInterval(Config.reloadTimer);
                    logger.info('Configuration reload stopped');
                });
            });
    }

    public static getConfItem(key: string): any {
        if (!Config.initialized) {
            logger.error(`Configuration holder has not been initialized. Returning undefined for property key ${key}`);
            return undefined;
        } else {
            return Config.appConf.get(key);
        }
    }

    private static isAppScoped(appName: string): boolean {
        return appName.startsWith("@") && appName.indexOf("/") > 0;
    }

    private static stripAppScope(appName: string): string {
        return appName.split("/")[1];
    }

}

export class ConfigOptions {
    stripScope = false;
    packageDotJsonPath?: string;
    appName?: string;
    appVersion?: string;
    appEnv?: string;
    appConfigPath?: string;
}
