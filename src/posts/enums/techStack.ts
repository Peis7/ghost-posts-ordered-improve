export enum TechStack {
    // Top 10 Programming Languages
    JavaScript = "JavaScript",
    Python = "Python",
    Java = "Java",
    CPlusPlus = "C++",
    TypeScript = "TypeScript",
    Ruby = "Ruby",
    Swift = "Swift",
    Rust = "Rust",

    // Top 10 JavaScript/TypeScript Frameworks
    React = "React",
    Angular = "Angular",
    Vue = "Vue.js",
    Svelte = "Svelte",
    NextJS = "Next.js",
    NuxtJS = "Nuxt.js",
    Express = "Express",
    NodeJS = "Node.js",
    NestJS = "NestJS",
    Gatsby = "Gatsby",

    // JavaScript/TypeScript Testing Frameworks
    Jest = "Jest",
    Mocha = "Mocha",
    Jasmine = "Jasmine",
    Cypress = "Cypress",
    Playwright = "Playwright",
    Puppeteer = "Puppeteer",
    Karma = "Karma",
    Ava = "Ava",
    TestingLibrary = "Testing Library",
    Enzyme = "Enzyme",

    // Top 10 Python Frameworks
    Django = "Django",
    Flask = "Flask",
    FastAPI = "FastAPI",
    Pyramid = "Pyramid",
    Bottle = "Bottle",
    CherryPy = "CherryPy",
    Tornado = "Tornado",
    Hug = "Hug",
    Falcon = "Falcon",
    Web2py = "Web2py",

    // Python Testing Frameworks
    Pytest = "Pytest",
    Unittest = "Unittest",
    Nose2 = "Nose2",
    RobotFramework = "Robot Framework",
    Behave = "Behave",
    Hypothesis = "Hypothesis",
    Lettuce = "Lettuce",
    PyUnit = "PyUnit",
    Testify = "Testify",
    Doctest = "Doctest",

    // Version Control Technologies
    Git = "Git",
    Subversion = "Subversion (SVN)",
    Mercurial = "Mercurial",

    // Kubernetes and Docker Technologies
    Docker = "Docker",
    DockerCompose = "Docker Compose",
    Kubernetes = "Kubernetes",
    Helm = "Helm",
    Minikube = "Minikube",
    Kustomize = "Kustomize",
    Rancher = "Rancher",
    OpenShift = "OpenShift",
    Istio = "Istio",
    DockerSwarm = "Docker Swarm",

    // Top 10 Most Used Databases
    MySQL = "MySQL",
    PostgreSQL = "PostgreSQL",
    MongoDB = "MongoDB",
    SQLite = "SQLite",
    Oracle = "Oracle",
    MicrosoftSQLServer = "Microsoft SQL Server",
    Redis = "Redis",
    Elasticsearch = "Elasticsearch",
    Cassandra = "Cassandra",
    MariaDB = "MariaDB",

    // Top 10 Blockchain Technologies
    Bitcoin = "Bitcoin",
    Ethereum = "Ethereum",
    BinanceSmartChain = "Binance Smart Chain",
    Cardano = "Cardano",
    Solana = "Solana",
    Polkadot = "Polkadot",
    Ripple = "Ripple",
    Litecoin = "Litecoin",
    Chainlink = "Chainlink",
    Stellar = "Stellar",

    // Ethereum-related Technologies
    Solidity = "Solidity",
    Truffle = "Truffle",
    Hardhat = "Hardhat",
    EthersJS = "Ethers.js",
    Web3JS = "Web3.js",
    OpenZeppelin = "OpenZeppelin",
    Geth = "Geth",
    Infura = "Infura",
    MetaMask = "MetaMask",
    Remix = "Remix",

    // Layer 2 Solutions for Ethereum
    Polygon = "Polygon",
    Optimism = "Optimism",
    Arbitrum = "Arbitrum",
    zkSync = "zkSync",
    StarkNet = "StarkNet",
    Loopring = "Loopring",
    ImmutableX = "Immutable X",
    xDAI = "xDAI",
    BobaNetwork = "Boba Network",
    Aztec = "Aztec",

    // Blockchain Testing and Development Tools
    Ganache = "Ganache",
    Brownie = "Brownie",
    Tenderly = "Tenderly",
    Foundry = "Foundry",
    ApeWorx = "ApeWorx",

    // Blockchain Interoperability and Oracles
    ChainlinkVRF = "Chainlink VRF",
    ChainlinkKeepers = "Chainlink Keepers",
    BandProtocol = "Band Protocol",
    PolkadotParachains = "Polkadot Parachains",
    CosmosIBC = "Cosmos IBC",
}

// Creating a Set from the enum values
export const techStackSet = new Set(Object.values(TechStack));

// Function to validate if a value is a valid enum member
export function isTechStack(value: any): value is TechStack {
    return techStackSet.has(value);
}
