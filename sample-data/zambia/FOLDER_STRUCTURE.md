# Zambian Organizations Folder Structure

This document describes the reorganized folder structure where each institution type contains subfolders for specific organizations.

## Structure Overview

Each institution type folder now contains subfolders for individual organizations:

```
zambia/
├── anticorruption/
│   ├── anti-corruption-commission/    (Anti-Corruption Commission - ACC)
│   └── drug-enforcement-commission/   (Drug Enforcement Commission - DEC)
├── centralbank/
│   └── bank-of-zambia/                (Bank of Zambia - BOZ)
├── revenuecollection/
│   └── zambia-revenue-authority/      (Zambia Revenue Authority - ZRA)
├── commercialbank/
│   ├── zanaco/
│   ├── fnb-zambia/
│   ├── absa-bank-zambia/
│   └── ... (50 banks total)
├── newspaper/
│   ├── news-diggers/
│   ├── the-mast/
│   ├── daily-nation/
│   └── ... (multiple newspapers)
├── telecom/
│   ├── mtn-zambia/
│   ├── zamtel/
│   ├── airtel-zambia/
│   └── ... (multiple operators)
└── ... (other institution types)
```

## Organization-Specific Folders

Each organization folder contains:
- **{organization-name}.json**: Organization profile data with entries for different divisions/departments
- **Operational data files**: Files like `entities-zra.json`, `audit-dashboard-zra.json`, etc. (where applicable)

### Example: Anti-Corruption Commission

```
anticorruption/anti-corruption-commission/
├── anti-corruption-commission.json        (50 ACC entries - HQ, divisions, regional offices)
├── audit-dashboard-zra.json               (Operational data)
├── compliance-hub-zra.json
├── entities-zra.json
└── ... (other operational files)
```

### Example: Drug Enforcement Commission

```
anticorruption/drug-enforcement-commission/
└── drug-enforcement-commission.json       (2 DEC entries - HQ, Investigation Unit)
```

## Institution Types with Single Main Organization

Some institution types have a single main organization:
- **Police**: Zambia Police Service
- **Defense**: Zambia Defence Force
- **Intelligence**: Zambia Security Intelligence Service (ZSIS)
- **Financial Intelligence**: Financial Intelligence Centre (FIC)
- **Auditing**: Office of the Auditor General

## Institution Types with Multiple Organizations

These institution types have multiple independent organizations:
- **Commercial Banks**: 50+ banks including Zanaco, FNB, Absa, Stanbic, etc.
- **Newspapers**: 30+ newspapers including News Diggers, The Mast, Daily Nation, etc.
- **Telecom**: 40+ telecom operators including MTN, Zamtel, Airtel, etc.
- **Television**: 40+ TV stations including ZNBC, Muvi TV, Prime TV, etc.
- **Radio**: 30+ radio stations including Radio Phoenix, Q-FM, Hot FM, Breeze FM, etc.
- **Insurance**: 40+ insurance companies
- **Microfinance**: 40+ microfinance institutions
- **NGOs**: 40+ international NGOs
- **Ministries**: Multiple government ministries

## Benefits of This Structure

1. **Organization Clarity**: Each organization has its own dedicated folder
2. **Data Isolation**: Organization-specific data is clearly separated
3. **Scalability**: Easy to add new organizations or data files
4. **Maintainability**: Clear hierarchy makes updates easier
5. **Multi-tenant Support**: Better supports the platform's multi-tenant architecture
