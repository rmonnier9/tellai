import {
    type FieldDataInput,
    framer,
    type ManagedCollection,
    type ManagedCollectionFieldInput,
    type ManagedCollectionItemInput,
    type ProtectedMethod,
} from "framer-plugin"

export const PLUGIN_KEYS = {
    DATA_SOURCE_ID: "dataSourceId",
    SLUG_FIELD_ID: "slugFieldId",
    API_KEY: "apiKey",
} as const

export interface DataSource {
    id: string
    fields: readonly ManagedCollectionFieldInput[]
    items: FieldDataInput[]
}

export const dataSourceOptions = [
    { id: "articles", name: "Articles" },
    { id: "categories", name: "Categories" },
] as const

/**
 * Retrieve data from Lovarank API and process it into a structured format.
 *
 * @example
 * {
 *   id: "articles",
 *   fields: [
 *     { id: "title", name: "Title", type: "string" },
 *     { id: "content", name: "Content", type: "formattedText" }
 *   ],
 *   items: [
 *     { title: "My First Article", content: "Hello world" },
 *     { title: "Another Article", content: "More content here" }
 *   ]
 * }
 */
export async function getDataSource(apiKey: string, abortSignal?: AbortSignal): Promise<DataSource> {
    // Fetch from Lovarank API
    const apiUrl = "https://app.lovarank.com/api/integrations/framer/articles"

    const response = await fetch(apiUrl, {
        signal: abortSignal,
        headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
        },
    })

    console.log(response)

    if (!response.ok) {
        throw new Error(`Failedd to fetch articles: ${response.statusText}`)
    }

    const { data } = await response.json()
    const articles = data.articles || []

    // Define the fields structure for Framer
    const fields: ManagedCollectionFieldInput[] = [
        { id: "Image", name: "Image", type: "string" },
        { id: "Title", name: "Title", type: "string" },
        { id: "Slug", name: "Slug", type: "string" },
        { id: "Meta Description", name: "Meta Description", type: "string" },
        { id: "Content", name: "Content", type: "formattedText" },
        { id: "CreatedAt", name: "CreatedAt", type: "date" },
        { id: "Status", name: "Status", type: "string" },
    ]

    // Transform articles to FieldDataInput format
    const items: FieldDataInput[] = articles.map(
        (article: {
            Image?: string
            Title?: string
            Slug?: string
            "Meta Description"?: string
            Content?: string
            CreatedAt?: string
            Status?: string
        }) => ({
            Image: { type: "string", value: article.Image || "" },
            Title: { type: "string", value: article.Title || "" },
            Slug: { type: "string", value: (article.Slug || "").substring(0, 64) }, // Limit to 64 chars for Framer ID
            "Meta Description": { type: "string", value: article["Meta Description"] || "" },
            Content: { type: "formattedText", value: article.Content || "" },
            CreatedAt: { type: "date", value: article.CreatedAt || new Date().toISOString().split("T")[0] },
            Status: { type: "string", value: article.Status || "Draft" },
        })
    )

    return {
        id: "articles",
        fields,
        items,
    }
}

export function mergeFieldsWithExistingFields(
    sourceFields: readonly ManagedCollectionFieldInput[],
    existingFields: readonly ManagedCollectionFieldInput[]
): ManagedCollectionFieldInput[] {
    return sourceFields.map(sourceField => {
        const existingField = existingFields.find(existingField => existingField.id === sourceField.id)
        if (existingField) {
            return { ...sourceField, name: existingField.name }
        }
        return sourceField
    })
}

export async function syncCollection(
    collection: ManagedCollection,
    dataSource: DataSource,
    fields: readonly ManagedCollectionFieldInput[],
    slugFieldId: string,
    apiKey: string
) {
    const items: ManagedCollectionItemInput[] = []
    const unsyncedItems = new Set(await collection.getItemIds())

    for (let i = 0; i < dataSource.items.length; i++) {
        const item = dataSource.items[i]
        if (!item) throw new Error("Logic error")

        const slugValue = item[slugFieldId]
        if (!slugValue || typeof slugValue.value !== "string") {
            console.warn(`Skipping item at index ${i} because it doesn't have a valid slug`)
            continue
        }

        unsyncedItems.delete(slugValue.value)

        const fieldData: FieldDataInput = {}
        for (const [fieldName, value] of Object.entries(item)) {
            const field = fields.find(field => field.id === fieldName)

            // Field is in the data but skipped based on selected fields.
            if (!field) continue

            // For details on expected field value, see:
            // https://www.framer.com/developers/plugins/cms#collections
            fieldData[field.id] = value
        }

        items.push({
            id: slugValue.value,
            slug: slugValue.value,
            draft: false,
            fieldData,
        })
    }

    await collection.removeItems(Array.from(unsyncedItems))
    await collection.addItems(items)

    await collection.setPluginData(PLUGIN_KEYS.DATA_SOURCE_ID, dataSource.id)
    await collection.setPluginData(PLUGIN_KEYS.SLUG_FIELD_ID, slugFieldId)
    await collection.setPluginData(PLUGIN_KEYS.API_KEY, apiKey)
}

export const syncMethods = [
    "ManagedCollection.removeItems",
    "ManagedCollection.addItems",
    "ManagedCollection.setPluginData",
] as const satisfies ProtectedMethod[]

export async function syncExistingCollection(
    collection: ManagedCollection,
    previousDataSourceId: string | null,
    previousSlugFieldId: string | null
): Promise<{ didSync: boolean }> {
    if (!previousDataSourceId) {
        return { didSync: false }
    }

    if (framer.mode !== "syncManagedCollection" || !previousSlugFieldId) {
        return { didSync: false }
    }

    if (!framer.isAllowedTo(...syncMethods)) {
        return { didSync: false }
    }

    try {
        // Retrieve the stored API key from plugin data
        const apiKey = await collection.getPluginData(PLUGIN_KEYS.API_KEY)
        if (!apiKey) {
            framer.notify("API key not found. Please reconfigure the plugin.", {
                variant: "error",
            })
            return { didSync: false }
        }

        const dataSource = await getDataSource(apiKey)
        const existingFields = await collection.getFields()

        await syncCollection(collection, dataSource, existingFields, "Slug", apiKey)
        return { didSync: true }
    } catch (error) {
        console.error(error)
        framer.notify(`Failed to sync collection "${previousDataSourceId}". Check browser console for more details.`, {
            variant: "error",
        })
        return { didSync: false }
    }
}
