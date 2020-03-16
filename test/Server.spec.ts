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
        try {
            fs.unlinkSync("data/datasets.txt");
        } catch (err) {
            //
        }
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
    });

    // Sample on how to format PUT requests

    it("PUT test for courses dataset: should succeed", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/AAN/courses")
                .send(fs.readFileSync("test/data/AAN.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("response: " + res);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(`failed in the outer catch block with ${err}`);
            expect.fail();
        }
    });

    it("PUT test for rooms dataset: should succeed", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/rooms/rooms")
                .send(fs.readFileSync("test/data/rooms.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("response: " + res);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(`failed in the outer catch block with ${err}`);
            expect.fail();
        }
    });

    it("PUT test for courses dataset, invalid kind: should fail", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/AAN/INVALIDKIND")
                .send(fs.readFileSync("test/data/AAN.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("response: " + res);
                    expect(res.status).to.be.equal(400);
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(`failed in the outer catch block with ${err}`);
            expect.fail();
        }
    });

    it("PUT test for courses dataset, invalid content type: should fail", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/notazip/courses")
                .send(fs.readFileSync("test/data/notazip.txt"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("response: " + res);
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(`failed in the outer catch block with ${err}`);
            expect.fail();
        }
    });

    it("PUT test for courses dataset, same courses added twice: should fail", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/AAN/courses")
                .send(fs.readFileSync("test/data/AAN.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("response: " + res);
                    return chai.request("http://localhost:4321")
                        .put("/dataset/:AAN/:courses")
                        .send(fs.readFileSync("test/data/AAN.zip"))
                        .set("Content-Type", "application/x-zip-compressed")
                        .then(function (res2: Response) {
                            expect.fail();
                        })
                        .catch(function (err) {
                            Log.trace(err);
                            expect(err.status).to.be.equal(400);
                        });
                });
        } catch (err) {
            Log.trace(`failed in the outer catch block with ${err}`);
            expect.fail();
        }
    });

    it("DELETE test for courses dataset: should succeed", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/AAN/courses")
                .send(fs.readFileSync("test/data/AAN.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("response: " + res);
                    return chai.request("http://localhost:4321")
                        .del("/dataset/AAN");
                })
                .then(function (res2: Response) {
                    expect(res2.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(`failed in the outer catch block with ${err}`);
            expect.fail();
        }
    });

    it("DELETE test for courses dataset: dataset not previously added, should fail", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/notanaddeddataset")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.trace(`failed in the outer catch block with ${err}`);
            expect.fail();
        }
    });

    it("DELETE test for courses dataset: dataset contains underscore, should fail", function () {
        try {
            return chai.request("http://localhost:4321")
                .del("/dataset/invalidname_")
                .then(function (res: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(`failed in the outer catch block with ${err}`);
            expect.fail();
        }
    });

    // ** a whitespace id gets truncated to empty string, so this test doesn't work properly
    // it("DELETE test for courses dataset: dataset contains only whitespace, should fail", function () {
    //     try {
    //         return chai.request("http://localhost:4321")
    //             .del("/dataset/ ")
    //             .set("Content-Type", "application/x-zip-compressed")
    //             .then(function (res: Response) {
    //                 expect.fail();
    //             })
    //             .catch(function (err) {
    //                 Log.trace(err);
    //                 expect(err.status).to.be.equal(400);
    //             });
    //     } catch (err) {
    //         Log.trace(`failed in the outer catch block with ${err}`);
    //         expect.fail();
    //     }
    // });

    it("DELETE test for courses dataset: try to delete same dataset twice should succeed then fail", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/AAN/courses")
                .send(fs.readFileSync("test/data/AAN.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("response: " + res);
                    return chai.request("http://localhost:4321")
                        .del("/dataset/AAN");
                })
                .then(function (res: Response) {
                    Log.trace("response: " + res);
                    return chai.request("http://localhost:4321")
                        .del("/dataset/AAN");
                })
                .then(function (res2: Response) {
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect(err.status).to.be.equal(404);
                });
        } catch (err) {
            Log.trace(`failed in the outer catch block with ${err}`);
            expect.fail();
        }
    });

    it("GET test for courses dataset: should succeed", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/AAN/courses")
                .send(fs.readFileSync("test/data/AAN.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(() => {
                    return chai.request("http://localhost:4321")
                        .get("/datasets");
                })
                .then(function (res: Response) {
                    Log.trace("response: " + res);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(`failed in the outer catch block with ${err}`);
            expect.fail();
        }
    });

    it("POST test for courses dataset: simple query, should succeed", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/courses/courses")
                .send(fs.readFileSync("test/data/courses.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(() => {
                    return chai.request("http://localhost:4321")
                        .post("/query")
                        .send(testQuery1)
                        .set("Content-Type", "application/json");
                })
                .then(function (res: Response) {
                    Log.trace("response: " + res);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect.fail();
                });
        } catch (err) {
            Log.trace(`failed in the outer catch block with ${err}`);
            expect.fail();
        }
    });

    it("POST test for courses dataset: invalid keys in query, should fail", function () {
        try {
            return chai.request("http://localhost:4321")
                .put("/dataset/AAN/courses")
                .send(fs.readFileSync("test/data/AAN.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(() => {
                    return chai.request("http://localhost:4321")
                        .post("/query")
                        .send(testQuery1)
                        .set("Content-Type", "application/json");
                })
                .then(function (res: Response) {
                    Log.trace("response: " + res);
                    expect.fail();
                })
                .catch(function (err) {
                    Log.trace(err);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            Log.trace(`failed in the outer catch block with ${err}`);
            expect.fail();
        }
    });

    const testQuery1: any = {
        WHERE: {
            GT: {
                courses_avg: 97
            }
        },
        OPTIONS: {
            COLUMNS: [
                "courses_dept",
                "courses_avg"
            ],
            ORDER: "courses_avg"
        }
    };
    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
