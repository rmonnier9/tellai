import { useState } from "react"

interface CreateCollectionProps {
    onNext: () => void
}

export function CreateCollection({ onNext }: CreateCollectionProps) {
    const [collectionName, setCollectionName] = useState("Lovarank")

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (collectionName.trim()) {
            onNext()
        }
    }

    return (
        <main className="framer-hide-scrollbar setup">
            <div className="intro">
                <div className="logo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="none">
                        <title>Lovarank</title>
                        <path
                            fill="currentColor"
                            d="M15.5 8c3.59 0 6.5 1.38 6.5 3.083 0 1.702-2.91 3.082-6.5 3.082S9 12.785 9 11.083C9 9.38 11.91 8 15.5 8Zm6.5 7.398c0 1.703-2.91 3.083-6.5 3.083S9 17.101 9 15.398v-2.466c0 1.703 2.91 3.083 6.5 3.083s6.5-1.38 6.5-3.083Zm0 4.316c0 1.703-2.91 3.083-6.5 3.083S9 21.417 9 19.714v-2.466c0 1.702 2.91 3.083 6.5 3.083S22 18.95 22 17.248Z"
                        />
                    </svg>
                </div>
                <div className="content">
                    <h2>New Collection</h2>
                    <p>This Plugin will create a new Collection for you that can be synced at any time.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <label htmlFor="collectionName">
                    <input
                        id="collectionName"
                        type="text"
                        value={collectionName}
                        onChange={event => setCollectionName(event.target.value)}
                        placeholder="Collection name"
                        required
                    />
                </label>
                <button type="submit" disabled={!collectionName.trim()}>
                    Create
                </button>
            </form>
        </main>
    )
}
