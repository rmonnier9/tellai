import { useState } from "react"

interface ApiKeySetupProps {
    onNext: (apiKey: string) => void
}

export function ApiKeySetup({ onNext }: ApiKeySetupProps) {
    const [apiKey, setApiKey] = useState("")

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (apiKey.trim()) {
            onNext(apiKey.trim())
        }
    }

    return (
        <main className="framer-hide-scrollbar setup api-key-setup">
            <div className="intro">
                <div className="logo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="none">
                        <title>Lovarank</title>
                        <circle cx="25" cy="25" r="25" fill="#7C3AED" />
                        <path
                            fill="white"
                            d="M25.5 16c3.59 0 6.5 1.38 6.5 3.083 0 1.702-2.91 3.082-6.5 3.082S19 20.785 19 19.083C19 17.38 21.91 16 25.5 16Zm6.5 7.398c0 1.703-2.91 3.083-6.5 3.083S19 25.101 19 23.398v-2.466c0 1.703 2.91 3.083 6.5 3.083s6.5-1.38 6.5-3.083Zm0 4.316c0 1.703-2.91 3.083-6.5 3.083S19 29.417 19 27.714v-2.466c0 1.702 2.91 3.083 6.5 3.083S32 26.95 32 25.248Z"
                        />
                    </svg>
                </div>
                <div className="content">
                    <h2>Lovarank</h2>
                    <p>Enter your API Key:</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <label htmlFor="apiKey">
                    <input
                        id="apiKey"
                        type="text"
                        value={apiKey}
                        onChange={event => setApiKey(event.target.value)}
                        placeholder="XXXXXXXXXXXXXX"
                        required
                    />
                </label>
                <p className="help-text">
                    You can get your api key at{" "}
                    <a
                        href="https://app.lovarank.com/integrations/new/framer"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        app.lovarank.com
                    </a>
                </p>
                <button type="submit" disabled={!apiKey.trim()}>
                    Next
                </button>
            </form>
        </main>
    )
}
