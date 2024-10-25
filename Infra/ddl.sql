-- Users Table
CREATE TABLE Users (
    UserId SERIAL PRIMARY KEY,
    Username VARCHAR(100) NOT NULL,
    Password VARCHAR(255) NOT NULL
);

-- PriceTier Table
CREATE TABLE PriceTier (
    PriceTierId SERIAL PRIMARY KEY,
    PricePerHour NUMERIC(10, 2) NOT NULL
);

-- Instance Table
CREATE TABLE Instance (
    InstanceId SERIAL PRIMARY KEY,
    SystemType VARCHAR(100) NOT NULL,
    CPUCoreCount INT NOT NULL,
    Storage NUMERIC(10, 2) NOT NULL, -- Size in GB or appropriate unit
    Memory NUMERIC(10, 2) NOT NULL,  -- Size in GB or appropriate unit
    IPAddress INET NOT NULL,
    Username VARCHAR(100) NOT NULL,  -- Username for the instance login
    Password VARCHAR(255) NOT NULL,  -- Password for the instance login
    PriceTierId INT NOT NULL,        -- Foreign key to PriceTier
    Booted BOOLEAN DEFAULT FALSE,    -- Whether the instance is booted or not
    AllocatedUserId INT,             -- Foreign key to Users (if needed for allocation)
    FOREIGN KEY (PriceTierId) REFERENCES PriceTier (PriceTierId),
    FOREIGN KEY (AllocatedUserId) REFERENCES Users (UserId)
);

-- UsageLogs Table to track each user's usage of an instance
CREATE TABLE UsageLogs (
    UsageLogId SERIAL PRIMARY KEY,
    UserId INT NOT NULL,                   -- Foreign key to Users
    InstanceId INT NOT NULL,               -- Foreign key to Instance
    StartTime TIMESTAMP NOT NULL,          -- Start time of the session
    EndTime TIMESTAMP,                     -- End time of the session, NULL if still running
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (InstanceId) REFERENCES Instance(InstanceId)
);

