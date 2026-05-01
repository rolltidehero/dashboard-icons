/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
	const collection = new Collection({
		type: "base",
		name: "external_icons",
		listRule: "",
		viewRule: "",
		createRule: null,
		updateRule: null,
		deleteRule: null,
		fields: [
			{
				name: "source",
				type: "select",
				required: true,
				maxSelect: 1,
				values: ["selfhst"],
			},
			{
				name: "slug",
				type: "text",
				required: true,
				presentable: true,
			},
			{
				name: "name",
				type: "text",
				required: true,
				presentable: true,
			},
			{
				name: "aliases",
				type: "json",
			},
			{
				name: "categories",
				type: "json",
			},
			{
				name: "formats",
				type: "json",
			},
			{
				name: "variants",
				type: "json",
			},
			{
				name: "url_templates",
				type: "json",
			},
			{
				name: "license",
				type: "text",
			},
			{
				name: "attribution",
				type: "text",
			},
			{
				name: "source_url",
				type: "url",
			},
			{
				name: "updated_at_source",
				type: "date",
			},
		],
		indexes: ["CREATE UNIQUE INDEX idx_external_icons_source_slug ON external_icons (source, slug)"],
	})

	return app.save(collection)
}, (app) => {
	const collection = app.findCollectionByNameOrId("external_icons")

	return app.delete(collection)
})
