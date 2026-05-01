/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
	const collection = app.findCollectionByNameOrId("external_icons")
	const sourceField = collection.fields.find((f) => f.name === "source")
	sourceField.values = ["selfhst", "lobehub"]
	return app.save(collection)
}, (app) => {
	const collection = app.findCollectionByNameOrId("external_icons")
	const sourceField = collection.fields.find((f) => f.name === "source")
	sourceField.values = ["selfhst"]
	return app.save(collection)
})
