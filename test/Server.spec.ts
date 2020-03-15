import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Response = ChaiHttp.Response;
import {expect} from "chai";
import * as fs from "fs";
import Log from "../src/Util";

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // not sure if this is proper error handling
        server.start()
            .catch((err: any) => {
                Log.trace("server failed to start for some reason, failed in before hook: " + err);
            });
    });

    after(function () {
        server.stop();
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // Sample on how to format PUT requests

    it("PUT test for courses dataset: should succeed", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/:AAN/:courses")
                .send(fs.readFileSync("test/data/AAN.zip", "buffer"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            expect.fail();
            Log.trace(`failed in the outer catch block with ${err}`);
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
