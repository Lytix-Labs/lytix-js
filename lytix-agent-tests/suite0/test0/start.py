import asyncio
import json


async def start():
    """
    Start the test and print the results to the console
    """
    toReturn = {
        "output": "This file defines how Helicone handles custom HTTP headers for its API proxy service. Here are the key points:\n\n1. **Header Processing**: The `HeliconeHeaders` class processes various custom headers prefixed with `helicone-` that control different aspects of the service, such as:\n   - Authentication (`helicone-auth`, `helicone-jwt`)\n   - Rate limiting (`Helicone-RateLimit-Policy`)\n   - Retry logic (`helicone-retry-*`)\n   - Prompt management (`Helicone-Prompt-*`)\n   - Session tracking (`Helicone-Session-*`)\n\n2. **Feature Flags**: Manages feature flags for:\n   - Stream formatting\n   - Timeout adjustments\n\n3. **Fallback Handling**: Processes fallback configurations for handling failed requests through the `HeliconeFallback` type\n\n4. **Properties Collection**: Automatically collects and processes custom properties from headers starting with `helicone-property-`\n\nThe class serves as a central parser and validator for all Helicone-specific headers that clients can send to customize their API proxy behavior.\n\nThis is a core part of Helicone's worker infrastructure, handling the configuration layer of requests passing through the proxy.",
        "messages": [
            {
                "id": 1,
                "content": "What does this file do: worker/src/lib/models/HeliconeHeaders.ts",
                "role": "user",
            }
        ],
        "sources": ["/worker/src/lib/models/HeliconeHeaders.ts"],
    }
    print(json.dumps(toReturn))


if __name__ == "__main__":
    asyncio.run(start())
