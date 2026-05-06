/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
	const collection = app.findCollectionByNameOrId("pbc_632646243")
	collection.updateRule = "@request.auth.id = created_by.id || @request.auth.admin = true || status = 'rejected'"
	return app.save(collection)
}, (app) => {
	const collection = app.findCollectionByNameOrId("pbc_632646243")
	collection.updateRule = "@request.auth.id = created_by.id || @request.auth.admin = true"
	return app.save(collection)
})
