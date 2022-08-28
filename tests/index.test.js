const app = require("../src");
const request = require("supertest");
const { initializeDatabase } = require("../src/Database");

const validRecord1 = {
	city: "df",
	state: "bahia",
	requester: "policia federal",
	document_type: "e-mail",
	document_number: "10/04/2021",
	document_date: "15/04/2021",
	description: "ABCDEFGHIJKL",
	sei_number: "1234",
	receipt_form: "form",
	contact_info: "info@gmail.com",
	created_by: "william@pcgo.com",
	tags: [],
};

const validRecord2 = {
	city: "df",
	state: "bahia",
	requester: "policia civil",
	document_type: "fisico",
	document_number: "1020304050",
	document_date: "15/04/2021",
	description: "ABCDEFGHIJKL",
	sei_number: "12345",
	receipt_form: "form",
	contact_info: "info@gmail.com",
	situation: 2,
	created_by: "william@pcgo.com",
	tags: [],
};

const invalidRecord1 = {
	city: "df",
	state: "bahia",
	requester: "policia civil",
	document_type: "fisico",
	document_number: "1020304050",
	document_date: "15/04/2021",
	description: "ABCDEFGHIJKL",
	sei_number: "1234",
	receipt_form: "form",
	contact_info: "info@gmail.com",
	created_by: -50,
};

const emptyRecord = {};

const user = {
	name: "tester",
	email: "tester@email.com",
	department_id: 1,
};

const tag1 = {
	name: "Tag One",
	color: "#ab1111",
};

const tag2 = {
	name: "Tag Two",
	color: "#ac1212",
};

const tagCopy = {
	name: "Tag One",
	color: "#ab1111",
};

describe("Sub Test", () => {
	const test1 = 1;
	const test2 = 2;
	const { loadEnvironment } = require("../src/Database");

	it("Test empty database URL", (done) => {
		const result = loadEnvironment(test1);
		expect(result).toBe(null);
		done();
	});

	it("Test PROD environment var", (done) => {
		const result = loadEnvironment(test2);
		expect(result.dialectOptions).toBeDefined();
		done();
	});
});

describe("Main test", () => {
	let last_record_id = 0;

	beforeAll(async () => {
		await initializeDatabase();
	});

	it("Test express server app", (done) => {
		expect(app).toBeDefined();
		done();
	});

	it("GET /records/:id/tags - should return tags", async () => {
		const res1 = await request(app).post("/records").send(validRecord1);
		expect(res1.statusCode).toEqual(200);

		const res2 = await request(app)
			.post(`/records/${res1.body.id}/add-tag`)
			.send({ tag_id: 1 });
		expect(res2.statusCode).toEqual(200);

		const res = await request(app).get(`/records/${res1.body.id}/tags`);
		expect(res.statusCode).toEqual(200);
	});

	it("GET /records/:id/tags - should return error (no record)", async () => {
		const res = await request(app).get("/records/5000/tags");
		expect(res.statusCode).toEqual(404);
	});

	it("POST /records/page/0 - should not return any records", async () => {
		const res = await request(app)
			.post("/records/page/40")
			.send({ department_id: 5699 });
		expect(res.statusCode).toEqual(204);
	});

	it("POST /records/page/0 - should not return any records (where error)", async () => {
		const res = await request(app)
			.post("/records/page/40")
			.send({ where: { teste: "teste" } });
		expect(res.statusCode).toEqual(500);
	});

	it("POST /records - should create a record", async () => {
		const res = await request(app).post("/records").send(validRecord1);
		expect(res.statusCode).toBe(200);
	});

	it("POST /records - should create a record", async () => {
		const res = await request(app).post("/records").send(validRecord2);
		expect(res.statusCode).toBe(200);
	});

	it("POST /records - should not create a record", async () => {
		const res = await request(app).post("/records").send(emptyRecord);
		expect(res.statusCode).toEqual(404);
		expect(res.body.error).toBeDefined();
	});

	it("GET /records - should get all registered records", async () => {
		const res = await request(app).get("/records");
		expect(res.statusCode).toEqual(200);
	});

	it("GET /records/:id - should return a record", async () => {
		const res = await request(app).get(`/records/1`);
		expect(res.statusCode).toEqual(200);
	});

	it("POST /records - should not create a record (inexistent created_by)", async () => {
		const res = await request(app).post("/records").send(invalidRecord1);
		expect(res.statusCode).toEqual(404);
		expect(res.body.error).toBeDefined();
	});

	it("POST /records/page/0 - should return at least one record", async () => {
		const res = await request(app).post("/records/page/0").send({});
		expect(res.statusCode).toEqual(200);
	});

	it("POST /records/page/-1 - should not return any records (invalid page)", async () => {
		const res = await request(app).post("/records/page/-1").send({});
		expect(res.statusCode).toEqual(500);
	});

	it("POST /records/1/forward - should forward a record", async () => {
		const payload = {
			destination_id: 2,
			origin_id: 2,
			forwarded_by: "william@pcgo.com",
		};

		const res = await request(app).post("/records/1/forward").send(payload);
		expect(res.statusCode).toEqual(200);
	});

	it("POST /records/1/forward - should not forward a record (forwarded mismatch)", async () => {
		const payload = {
			destination_id: 2,
			origin_id: 2,
			forwarded_by: "",
		};

		const res = await request(app).post("/records/1/forward").send(payload);
		expect(res.statusCode).toEqual(404);
	});

	it("POST /records/1/forward - should not forward a record (department mismatch)", async () => {
		const payload = {
			destination_id: 2,
			origin_id: 3,
			forwarded_by: "william@pcgo.com",
		};

		const res = await request(app).post("/records/1/forward").send(payload);
		expect(res.statusCode).toEqual(400);
		expect(res.body.error).toBeDefined();
	});

	it("POST /records/500/forward - should not forward (inexistent)", async () => {
		const department = {
			destination_id: 3,
			origin_id: 2,
			forwarded_by: 1,
		};
		const res = await request(app)
			.post("/records/500/forward")
			.send(department);
		expect(res.statusCode).toEqual(404);
	});

	it("POST /records/1/forward - should not forward (invalid department)", async () => {
		const invalid = '\
            {"department_id":"invalid"}   \
        ';
		const res = await request(app)
			.post("/records/500/forward")
			.send(invalid);
		expect(res.statusCode).toEqual(400);
	});

	it("GET /records/500 - should not return a inexistent record", async () => {
		const res = await request(app).get("/records/500");
		expect(res.statusCode).toEqual(404);
	});

	it("POST /records/1/status - should update record situation", async () => {
		const res = await request(app).post("/records/1/status").send({
			situation: "finished",
		});

		expect(res.statusCode).toEqual(200);
	});

	it("POST /records/1/status - should not update record situation", async () => {
		const res = await request(app).post("/records/1/status").send({
			situation: "situation123",
		});

		expect(res.statusCode).toEqual(400);
		expect(res.body.error).toBeDefined();
	});

	it("POST /records/500/status - should not update record situation (inexistent record)", async () => {
		const res = await request(app).post("/records/500/status").send({
			situation: "pending",
		});

		expect(res.statusCode).toEqual(404);
		expect(res.body.error).toBeDefined();
	});

	it("GET /records/fields - should return all fields", async () => {
		const res = await request(app).get("/records/fields");
		expect(res.statusCode).toEqual(200);
		expect(res.body[0].name).toBeDefined();
		expect(res.body[0].description).toBeDefined();
		expect(res.body[0].created_by).toBeDefined();
	});

	it("POST /users - should create a user", async () => {
		const res = await request(app).post("/users").send(user);
		expect(res.statusCode).toEqual(200);
	});

	it("POST /users - should not create a user (already exists)", async () => {
		const res = await request(app).post("/users").send(user);
		expect(res.statusCode).toEqual(500);
	});

	it("GET /records/1/history - should return history for specified record", async () => {
		const res = await request(app).get("/records/1/history");
		expect(res.statusCode).toEqual(200);
		expect(res.body).toBeDefined();
	});

	it("GET /records/500/history - should not return history for specified record (inexistent record)", async () => {
		const res = await request(app).get("/records/500/history");
		expect(res.statusCode).toEqual(404);
		expect(res.body).toBeDefined();
	});

	it("GET /count/records - should return some records", async () => {
		const res = await request(app).get("/count/records");
		expect(res.statusCode).toEqual(200);
	});

	it("GET /records/department/500 - should not find department", async () => {
		const res = await request(app).get("/records/department/500");
		expect(res.statusCode).toEqual(404);
	});

	it("GET /records/department/2 - should return a empty list of records", async () => {
		const res = await request(app).get("/records/department/2");
		expect(res.statusCode).toEqual(200);
	});

	it("GET /records/department/3 - should return the records on department 3", async () => {
		const res = await request(app).get("/records/department/3");
		expect(res.statusCode).toEqual(204);
	});

	it("POST /tag/new - should create a new tag", async () => {
		const res = await request(app).post("/tag/new").send(tag1);
		expect(res.statusCode).toEqual(200);
		expect(res.body).toBeDefined();
	});

	it("POST /tag/new - should not create a tag (color already exists)", async () => {
		const res = await request(app).post("/tag/new").send(tagCopy);
		expect(res.statusCode).toEqual(500);
		expect(res.body.error).toBeDefined();
	});

	it("GET /tags/all - should list all existing tags", async () => {
		const res = await request(app).get("/tags/all");
		expect(res.statusCode).toEqual(200);
		expect(res.body).toBeDefined();
	});

	it("POST /tag/:id/edit - should edit a specified tag", async () => {
		const res = await request(app).post("/tag/1/edit").send(tag2);
		expect(res.statusCode).toEqual(200);
		expect(res.body.message).toBeDefined();
	});

	it("GET /records/:id/tags - should list tags of a record (empty tags)", async () => {
		const res = await request(app).get("/records/1/tags");
		expect(res.statusCode).toEqual(200);
	});

	it("POST /records/:id/add-tag - should add tag 1 to record 1", async () => {
		const res = await request(app)
			.post("/records/1/add-tag")
			.send({ tag_id: 1 });
		expect(res.statusCode).toEqual(200);
	});

	it("POST /records/:id/add-tag - should not add tag to record", async () => {
		const res = await request(app)
			.post("/records/1/add-tag")
			.send({ tag_id: 500 });
		expect(res.statusCode).toEqual(404);
	});

	it("POST /records/:id/add-tag - should return error", async () => {
		const res = await request(app)
			.post("/records/asd/add-tag")
			.send({ tag_id: 500 });
		expect(res.statusCode).toEqual(500);
	});

	it("POST /records/:id/add-tag - should return error for record not found", async () => {
		const res = await request(app)
			.post("/records/5000/add-tag")
			.send({ tag_id: 1 });
		expect(res.statusCode).toEqual(404);
	});

	it("POST /records/:id/edit - should edit a record", async () => {
		const res = await request(app)
			.post("/records/1/edit")
			.send({ city: "Goiania", tags: [] });
		expect(res.statusCode).toEqual(200);
		expect(res.body).toBeDefined();
	});

	it("POST /records/:id/edit - should edit a record", async () => {
		const res = await request(app)
			.post("/records/a/edit")
			.send({ city: "Goiania" });
		expect(res.statusCode).toEqual(500);
	});

	it("POST /records/:id/edit - should not find a record", async () => {
		const res = await request(app)
			.post("/records/50000/edit")
			.send({ city: "Goiania" });
		expect(res.statusCode).toEqual(404);
	});

	it("GET /user/by-mail - should return user information", async () => {
		const res = await request(app)
			.post("/user/by-mail")
			.send({ email: "william@pcgo.com" });

		expect(res.statusCode).toEqual(200);
		expect(res.body.email).toBeDefined();
		expect(res.body.department_id).toBeDefined();
		expect(res.body.name).toBeDefined();
	});

	it("GET /user/by-mail - should not return user information (inexistent user)", async () => {
		const res = await request(app)
			.post("/user/by-mail")
			.send({ email: "zzz@bol.com" });

		expect(res.statusCode).toEqual(404);
	});

	it("POST /users - should not create a user (invalid email)", async () => {
		const res = await request(app).post("/users").send({
			name: "user",
			email: "user",
			department_id: 2,
		});

		expect(res.statusCode).toEqual(400);
	});

	it("POST /records/:id/close - should not close a record (no reason)", async () => {
		// Atualiza o status do registro para "pending" antes de fazer os demais testes
		const res1 = await request(app).post("/records/1/status").send({
			situation: "pending",
		});

		expect(res1.statusCode).toEqual(200);

		const res = await request(app)
			.post("/records/1/close")
			.send({ closed_by: "william@pcgo.com" });

		expect(res.statusCode).toEqual(400);
	});

	it("POST /records/:id/reopen - should not reopen a record (no reason)", async () => {
		const res = await request(app)
			.post("/records/1/reopen")
			.send({ reopened_by: "william@pcgo.com" });

		expect(res.statusCode).toEqual(400);
	});

	it("POST /records/:id/close - should close a record", async () => {
		const res = await request(app)
			.post("/records/1/close")
			.send({ closed_by: "william@pcgo.com", reason: "any reason" });

		expect(res.statusCode).toEqual(200);
	});

	it("POST /records/:id/close - should return a error (no record)", async () => {
		const res = await request(app)
			.post("/records/5000/close")
			.send({ closed_by: "william@pcgo.com", reason: "any reason" });

		expect(res.statusCode).toEqual(404);
	});

	it("POST /records/:id/close - should return a error (no closed_by)", async () => {
		const res = await request(app)
			.post("/records/1/close")
			.send({ reason: "any reason" });

		expect(res.statusCode).toEqual(400);
	});

	it("POST /records/:id/reopen - should reopen a record", async () => {
		const res = await request(app)
			.post("/records/1/reopen")
			.send({ reopened_by: "william@pcgo.com", reason: "any reason" });

		expect(res.statusCode).toEqual(200);
	});

	it("POST /records/:id/reopen - should not reopen a record (status already set)", async () => {
		const res = await request(app)
			.post("/records/1/reopen")
			.send({ reopened_by: "william@pcgo.com", reason: "any reason" });

		expect(res.statusCode).toEqual(400);
	});

	it("POST /records/:id/reopen - should not reopen a record (no record)", async () => {
		const res = await request(app)
			.post("/records/5000/reopen")
			.send({ reopened_by: "william@pcgo.com", reason: "any reason" });

		expect(res.statusCode).toEqual(404);
	});

	it("POST /records/:id/close - should not close (invalid field type)", async () => {
		const res = await request(app)
			.post("/records/1/close")
			.send({ closed_by: 1, reason: "any reason" });

		expect(res.statusCode).toEqual(500);
	});

	it("POST /records/:id/close - should not close (already set)", async () => {
		const res = await request(app)
			.post("/records/1/close")
			.send({ closed_by: 5000, reason: "any reason" });

		expect(res.statusCode).toEqual(400);
	});

	it("POST /records/:id/reopen - should not reopen (invalid field type)", async () => {
		const res = await request(app)
			.post("/records/1/reopen")
			.send({ reopened_by: 1, reason: "any reason" });

		expect(res.statusCode).toEqual(404);
		expect(res.body.error).toBeDefined();
	});

	it("POST /records/:id/reopen - should not reopen (no user information)", async () => {
		// Atualiza o status do registro para "pending" antes de fazer os demais testes
		const res1 = await request(app).post("/records/1/status").send({
			situation: "pending",
		});

		expect(res1.statusCode).toEqual(200);

		const res = await request(app)
			.post("/records/1/reopen")
			.send({ reason: "any reason" });

		expect(res.statusCode).toEqual(400);
		expect(res.body.error).toBeDefined();
	});

	it("POST /records/:id/close - should not reopen (record not found)", async () => {
		const res = await request(app)
			.post("/records/500/close")
			.send({ reason: "any reason", closed_by: "william@pcgo.com" });
		expect(res.statusCode).toEqual(404);
	});

	it("POST /records/:id/close - should not close (already closed)", async () => {
		// Atualiza o status do registro para "finished" antes de fazer os demais testes
		const res1 = await request(app).post("/records/1/status").send({
			situation: "finished",
		});

		expect(res1.statusCode).toEqual(200);

		const res = await request(app)
			.post("/records/1/reopen")
			.send({ closed_by: "william@pcgo.com", reason: "any reason" });

		expect(res.statusCode).toEqual(400);
	});

	it("POST /tag/:id/edit - should not edit a tag (inexistent tag)", async () => {
		const res = await request(app).post("/tag/500/edit");
		expect(res.statusCode).toEqual(404);
	});

	it("GET /records/with-sei - should not return a record", async () => {
		const res = await request(app).post("/records/with-sei").send({
			sei_number: "abcdef",
		});

		expect(res.statusCode).toEqual(200);
		expect(res.body.found).toEqual(false);
	});

	it("GET /records/with-sei - should not return a record", async () => {
		const res = await request(app).post("/records/with-sei").send({
			sei_number: "",
		});

		expect(res.statusCode).toEqual(400);
		expect(res.body.error).toBeDefined();
	});

	it("GET /records/with-sei - should return a record", async () => {
		const res = await request(app).post("/records/with-sei").send({
			sei_number: "1234",
		});

		expect(res.statusCode).toEqual(200);
		expect(res.body.found).toBeDefined();
		expect(res.body.found).toEqual(true);
	});

	it("GET /departments - should return a list of all departments", async () => {
		const res = await request(app).get("/departments");
		expect(res.statusCode).toEqual(200);
		expect(res.body).toBeDefined();
	});

	it("GET /records/:id/current-department - should return current department", async () => {
		const res = await request(app).get("/records/1/current-department");
		expect(res.statusCode).toEqual(200);
	});

	it("GET /records/:id/current-department - should return current department", async () => {
		const res = await request(app).get("/records/a/current-department");
		expect(res.statusCode).toEqual(400);
	});

	it("POST /departments - should create a department", async () => {
		const res = await request(app)
			.post("/departments")
			.send({ name: "teste" });
		expect(res.statusCode).toEqual(200);
	});

	it("POST /departments - should not create a department", async () => {
		const res = await request(app).post("/departments").send({});
		expect(res.statusCode).toEqual(400);
	});
});

describe("New test", () => {
	beforeAll(async () => {
		await initializeDatabase();
	});

	it("GET /department?name={name} - should return one department with passed name", async () => {
		const res = await request(app).get("/department?name=Gerência Adjunta");
		expect(res.statusCode).toEqual(200);
	});

	it("GET /department?name={} - should not return department info (empty name)", async () => {
		const res = await request(app).get("/department?name=");
		expect(res.statusCode).toEqual(400);
	});

	it("GET /department?name={name} - should not return department info (name doesnt exist)", async () => {
		const res = await request(app).get("/department?name=NULL");
		expect(res.statusCode).toEqual(404);
	});
});

afterAll((done) => {
	done();
});
