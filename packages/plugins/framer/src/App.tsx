import "./App.css"

import { framer, type ManagedCollection } from "framer-plugin"
import { useEffect, useLayoutEffect, useState } from "react"
import { ApiKeySetup } from "./ApiKeySetup.js"
import { CreateCollection } from "./CreateCollection.js"
import { type DataSource, getDataSource } from "./data.js"
import { FieldMapping } from "./FieldMapping.js"

interface AppProps {
    collection: ManagedCollection
    previousDataSourceId: string | null
    previousSlugFieldId: string | null
}

type Step = "create-collection" | "api-key" | "field-mapping"

export function App({ collection, previousDataSourceId, previousSlugFieldId }: AppProps) {
    const [step, setStep] = useState<Step>(previousDataSourceId ? "field-mapping" : "create-collection")
    const [apiKey, setApiKey] = useState<string>("")
    const [dataSource, setDataSource] = useState<DataSource | null>(null)
    const [isLoadingDataSource, setIsLoadingDataSource] = useState(Boolean(previousDataSourceId))

    useLayoutEffect(() => {
        const isFieldMapping = step === "field-mapping"

        framer.showUI({
            width: isFieldMapping ? 360 : 600,
            height: isFieldMapping ? 425 : 440,
            minWidth: isFieldMapping ? 360 : undefined,
            minHeight: isFieldMapping ? 425 : undefined,
            resizable: isFieldMapping,
        })
    }, [step])

    useEffect(() => {
        if (!previousDataSourceId) {
            return
        }

        const abortController = new AbortController()

        const loadExistingData = async () => {
            try {
                setIsLoadingDataSource(true)

                // Load API key from plugin data
                const storedApiKey = await collection.getPluginData("apiKey")
                if (!storedApiKey) {
                    framer.notify("API key not found. Please reconfigure the plugin.", {
                        variant: "error",
                    })
                    setIsLoadingDataSource(false)
                    setStep("api-key")
                    return
                }

                setApiKey(storedApiKey)

                // Load data source with the stored API key
                const dataSource = await getDataSource(storedApiKey, abortController.signal)
                setDataSource(dataSource)
                setIsLoadingDataSource(false)
            } catch (error) {
                if (abortController.signal.aborted) return

                console.error(error)
                framer.notify(
                    `Error loading previously configured data source "${previousDataSourceId}". Check the logs for more details.`,
                    {
                        variant: "error",
                    }
                )
                setIsLoadingDataSource(false)
            }
        }

        loadExistingData()

        return () => abortController.abort()
    }, [previousDataSourceId, collection])

    const handleCollectionCreated = () => {
        setStep("api-key")
    }

    const handleApiKeySubmitted = async (key: string) => {
        setApiKey(key)

        // Load the data source after API key is provided
        try {
            setIsLoadingDataSource(true)
            const dataSource = await getDataSource(key)
            setDataSource(dataSource)
            setStep("field-mapping")
        } catch (error) {
            console.error(error)
            framer.notify("Failed to load data source. Check the logs for more details.", {
                variant: "error",
            })
        } finally {
            setIsLoadingDataSource(false)
        }
    }

    if (isLoadingDataSource) {
        return (
            <main className="loading">
                <div className="framer-spinner" />
            </main>
        )
    }

    if (step === "create-collection") {
        return <CreateCollection onNext={handleCollectionCreated} />
    }

    if (step === "api-key") {
        return <ApiKeySetup onNext={handleApiKeySubmitted} />
    }

    if (step === "field-mapping" && dataSource && apiKey) {
        return (
            <FieldMapping
                collection={collection}
                dataSource={dataSource}
                initialSlugFieldId={previousSlugFieldId}
                apiKey={apiKey}
            />
        )
    }

    return null
}
