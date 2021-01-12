import * as sinon from "sinon";
import * as chai from "chai";
import * as FS from "mock-fs";
import { Config } from "../src/index";

describe("Config", () => {

    beforeEach(() => {

    });

    afterEach(() => {

    });

    it("Should return configuration items found in the deepest (L3) configuration folder.", (done) => {
        // Arrange
        const fs = new FS({
            "project": {
                "package.json": "{'name': '@gearedminds/ext-conf','version': '1.0.0'}"
            },
            "config": {
                "ext-conf-v1": {
                    "config.json": "prop1=value1"
                }
            }
        });
        // Act
        Config.init();
        const result = Config.getConfItem("prop1");

        // Assert
        chai.assert("value1", result);
    });

    it("Should return configuration items found in the middle (L2) configuration folder.", (done) => {
        // Arrange

        // Act

        // Assert
        done("Not yet implemented");
    });

    it("Should return configuration items found in the highest (L1) configuration folder.", (done) => {
        // Arrange

        // Act

        // Assert
        done("Not yet implemented");
    });

    it("Should throw an exception when no configuration file was resolved.", (done) => {
        // Arrange

        // Act

        // Assert
        done("Not yet implemented");
    });

});