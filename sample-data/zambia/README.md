# Zambian Organizations Data

This directory contains JSON data files representing actual Zambian organizations across various sectors. Each folder and JSON file contains organization profiles with their mandates, operations, and metrics.

## Key Organizations by Sector

### Revenue Collection
- **Zambia Revenue Authority (ZRA)** - National tax collection authority
  - File: `revenue-collection.json` and `revenue/` folder

### Anti-Corruption
- **Anti-Corruption Commission (ACC)** - Primary anti-corruption agency
- **Drug Enforcement Commission (DEC)** - Drug trafficking and narcotics-related corruption
  - File: `anti-corruption.json` and `anticorruption/` folder

### Financial Intelligence
- **Financial Intelligence Centre (FIC)** - Anti-money laundering and financial crimes
  - File: `financial-intelligence.json` and `financialintelligence/` folder

### Central Bank
- **Bank of Zambia (BOZ)** - Central banking and monetary policy
  - File: `central-bank.json` and `centralbank/` folder

### Commercial Banks
- **FNB Zambia** (First National Bank Zambia)
- **Zanaco** (Zambia National Commercial Bank)
- **Absa Bank Zambia**
- Stanbic Bank Zambia
- Standard Chartered Bank Zambia
- And others
  - File: `commercial-bank.json` and `commercialbank/` folder

### Newspapers
- **News Diggers**
- **The Mast**
- **Daily Nation**
- Zambia Daily Mail
- Times of Zambia
- The Post
- Lusaka Times
- And others
  - File: `newspaper.json` and `newspaper/` folder

### Telecommunications
- **MTN Zambia**
- **Zamtel** (Zambia Telecommunications Company)
- **Airtel Zambia**
- Liquid Telecom Zambia
- And others
  - File: `telecom.json` and `telecom/` folder

### Television
- **ZNBC** (Zambia National Broadcasting Corporation)
- **Muvi TV**
- **Prime Television**
- Diamond TV
- And others
  - File: `television.json` and `television/` folder

### Radio
- **Radio Phoenix**
- **Q-FM**
- **Hot FM**
- **Breeze FM**
- ZNBC Radio (Radio 1, Radio 2, Radio 4)
- Christian Voice
- And others
  - File: `radio.json` and `radio/` folder

### Police
- **Zambia Police Service**
  - Various divisions and regional units
  - File: `police.json` and `police/` folder

### Defense
- **Zambia Defence Force**
  - Zambia Army
  - Zambia Air Force
  - Zambia National Service
  - File: `defense.json` and `defense/` folder

### Intelligence
- **Zambia Security Intelligence Service (ZSIS)**
  - File: `intelligence.json` and `intelligence/` folder

### Ministries
- **Ministry of Finance and National Planning**
- **Ministry of Home Affairs and Internal Security**
- Ministry of Health
- Ministry of Education
- And other government ministries
  - File: `ministries.json` and `ministries/` folder

### Insurance Companies
- **ZSIC** (Zambia State Insurance Corporation)
- **Professional Insurance Corporation Zambia**
- **Madison General Insurance**
- ICEA LION Zambia
- Prudential Life Assurance Zambia
- Hollard Insurance Zambia
- And others
  - File: `insurance-company.json` and `insurancecompany/` folder

### Microfinance Institutions
- **VisionFund Zambia**
- **FINCA Zambia**
- **Bayport Financial Services**
- **Letshego Zambia**
- AB Microfinance Zambia
- And others
  - File: `microfinance-institution.json` and `microfinanceinstitution/` folder

### International NGOs
- **Transparency International Zambia**
- **Care International Zambia**
- **Oxfam Zambia**
- **World Vision Zambia**
- And others
  - File: `international-ngo.json` and `internationalngo/` folder

### Auditing
- **Office of the Auditor General**
  - Government auditing and oversight
  - File: `auditing.json` and `auditing/` folder

## Data Structure

Each JSON file contains an array of organization profiles with the following structure:

```json
{
  "TenantId": "UUID",
  "SubOrganizationType": "Type",
  "DisplayName": "Organization Name",
  "Country": "Zambia",
  "Headquarters": "City, Zambia",
  "Mandate": "Organization's mandate",
  "TopPriorities": ["Priority 1", "Priority 2", "..."],
  "ActiveOperations": ["Operation 1", "Operation 2", "..."],
  "RecentActions": [
    {
      "Title": "Action title",
      "Date": "ISO date",
      "Summary": "Action summary"
    }
  ],
  "KeyPartnerships": ["Partner 1", "Partner 2", "..."],
  "Metrics": {
    "Metric1": "Value",
    "Metric2": "Value"
  }
}
```

## Usage

These JSON files are loaded by the IntelligenceWebApp application to provide context-specific data for different organization types during testing and demonstration of the platform's multi-tenant capabilities.

## Data Sources

The organization names and information are based on actual Zambian institutions. The operational details, metrics, and activities are representative examples for demonstration purposes.
