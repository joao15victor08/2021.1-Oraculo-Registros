const { Department } = require("../Model/Department");

async function listDepartments(req, res) {
	const departments = await Department.findAll({
		attributes: ["id", "name"],
		order: [["name", "ASC"]],
	});

	return res.status(200).json(departments);
}

async function createDepartment(req, res) {
	const { name } = req.body;
	if (!name) {
		return res.status(400).send({
			error: "lacks of information to register department",
		});
	}

	try {
		const newDepartment = await Department.create({ name, is_admin: true });
		return res.status(200).send(newDepartment);
	} catch (error) {
		console.log(`could not create department: ${error}`);
		return res
			.status(500)
			.json({ error: "internal error during department creation" });
	}
}

async function getDepartmentByName(req, res) {
	const { name } = req.query;
	console.log(name);

	if (!name) {
		return res.status(400).json({
			error: "empty or missing parameter 'name'",
		});
	}
	const department = await Department.findOne({
		where: {
			name: name,
		},
	});

	if (!department) {
		return res.status(404).json({
			error: `could not find department ${name}`,
		});
	}

	return res.status(200).send(department);
}

module.exports = { listDepartments, createDepartment, getDepartmentByName };
