-- Users Table
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TABLE Users (
    UserId SERIAL PRIMARY KEY,
    Username VARCHAR(100) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    Role user_role NOT NULL
);
-- PriceTier Table
CREATE TABLE PriceTier (
    PriceTierId SERIAL PRIMARY KEY,
    price_tier VARCHAR(100) NOT NULL,
    PricePerHour NUMERIC(10, 2) NOT NULL
);
-- InstanceType Table
CREATE TABLE InstanceType (
    InstanceTypeId SERIAL PRIMARY KEY,
    InstanceType VARCHAR(100) NOT NULL,
    SystemType VARCHAR(100) NOT NULL,
    -- Fixed duplicate column
    CPUCoreCount INT NOT NULL,
    Storage NUMERIC(10, 2) NOT NULL,
    -- Size in GB or appropriate unit
    Memory NUMERIC(10, 2) NOT NULL,
    -- Size in GB or appropriate unit
    PriceTierId INT NOT NULL,
    -- Foreign key to PriceTier
    FOREIGN KEY (PriceTierId) REFERENCES PriceTier (PriceTierId)
);
-- Instance Table
CREATE TABLE Instance (
    InstanceId SERIAL PRIMARY KEY,
    InstanceTypeId INT NOT NULL,
    -- Foreign key to InstanceType
    InstanceName VARCHAR(100) NOT NULL,
    IPAddress INET NOT NULL,
    Username VARCHAR(100) NOT NULL,
    -- Username for the instance login
    Password VARCHAR(255) NOT NULL,
    -- Password for the instance login
    Booted BOOLEAN DEFAULT FALSE,
    -- Whether the instance is booted or not
    AllocatedUserId INT,
    -- Foreign key to Users (if needed for allocation)
    FOREIGN KEY (AllocatedUserId) REFERENCES Users (UserId),
    FOREIGN KEY (InstanceTypeId) REFERENCES InstanceType (InstanceTypeId)
);
-- UsageLogs Table to track each user's usage of an instance
CREATE TABLE UsageLogs (
    UsageLogId SERIAL PRIMARY KEY,
    UserId INT NOT NULL,
    -- Foreign key to Users
    InstanceId INT NOT NULL,
    -- Foreign key to Instance
    StartTime TIMESTAMP NOT NULL,
    -- Start time of the session
    EndTime TIMESTAMP,
    -- End time of the session, NULL if still running
    FOREIGN KEY (UserId) REFERENCES Users (UserId),
    FOREIGN KEY (InstanceId) REFERENCES Instance (InstanceId)
);