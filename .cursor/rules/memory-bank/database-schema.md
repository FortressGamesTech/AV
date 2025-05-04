# AV Client File System - Simplified Database Schema

## Core Tables

### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | TEXT | User email (unique) |
| name | TEXT | User's full name |
| role | ENUM | Role (event_coordinator, tech_lead, sales_manager, operations_manager, administrator) |
| department | ENUM | Department (tech, marketing, creative, operations) |
| permissions | JSONB | User permissions |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### clients
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Client name |
| contact_person | TEXT | Primary contact |
| company_name | TEXT | Company name |
| email | TEXT | Contact email |
| phone | TEXT | Contact phone |
| address | TEXT | Physical address |
| client_type | ENUM | Type (internal, external) |
| notes | TEXT | Additional notes |
| tags | TEXT[] | Tags for categorization |
| active_status | BOOLEAN | Whether client is active |
| external_links | JSONB | External URLs |
| created_by | UUID | Reference to users.id |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### locations
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Location name |
| address | TEXT | Physical address |
| capacity | INTEGER | Max capacity |
| facilities | JSONB | Available facilities |
| contact_person | TEXT | Contact name |
| contact_details | JSONB | Contact information |
| is_active | BOOLEAN | Whether location is active |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### events
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Event name |
| description | TEXT | Event description |
| client_id | UUID | Reference to clients.id |
| type | ENUM | Type (one_off, recurring, multi_day, multi_event) |
| status | ENUM | Status (quote, confirmed, in_progress, complete) |
| external_links | JSONB | External URLs |
| event_contacts | JSONB | Contact information |
| expected_patrons | INTEGER | Expected attendance |
| location_id | UUID | Reference to locations.id |
| event_dates | JSONB | Array of event dates |
| event_times | JSONB | Event time ranges |
| created_by | UUID | Reference to users.id |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### line_items
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Item name |
| description | TEXT | Short description |
| detailed_description | TEXT | Detailed description |
| type | ENUM | Type (service, package, capability) |
| department | ENUM | Department (tech, marketing, creative, operations) |
| cost_breakdown | JSONB | Cost details |
| default_rrp | DECIMAL | Default retail price |
| internal_cost | DECIMAL | Internal cost |
| required_resources | JSONB | Required resources |
| is_active | BOOLEAN | Whether item is active |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Junction Tables

### event_line_items
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| event_id | UUID | Reference to events.id |
| line_item_id | UUID | Reference to line_items.id |
| quantity | INTEGER | Quantity |
| unit_price | DECIMAL | Unit price |
| discount | DECIMAL | Discount amount |
| custom_price | DECIMAL | Custom price override |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### labor_types
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Labor type name |
| department | ENUM | Department |
| hourly_rate | DECIMAL | Hourly rate |
| min_hours | INTEGER | Minimum hours |
| skillset | TEXT[] | Required skills |
| certifications | TEXT[] | Required certifications |
| is_active | BOOLEAN | Whether type is active |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### event_labor_assignments
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| event_id | UUID | Reference to events.id |
| labor_type_id | UUID | Reference to labor_types.id |
| hours | INTEGER | Hours assigned |
| start_time | TIMESTAMPTZ | Start time |
| end_time | TIMESTAMPTZ | End time |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### roi_metrics
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Metric name |
| description | TEXT | Description |
| category | ENUM | Category (direct_revenue, value_attribution) |
| unit_value | DECIMAL | Value per unit |
| unit_type | TEXT | Unit type |
| calculation_method | TEXT | Calculation method |
| is_active | BOOLEAN | Whether metric is active |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### event_roi_metrics
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| event_id | UUID | Reference to events.id |
| roi_metric_id | UUID | Reference to roi_metrics.id |
| quantity | INTEGER | Quantity |
| value | DECIMAL | Value |
| notes | TEXT | Additional notes |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### resource_capacity
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| location_id | UUID | Reference to locations.id |
| labor_type_id | UUID | Reference to labor_types.id |
| available_hours_per_week | INTEGER | Hours available per week |
| staff_count | INTEGER | Number of staff |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Key Relationships

- **clients** → **events**: One client can have many events
- **locations** → **events**: One location can host many events
- **events** ↔ **line_items**: Many-to-many through event_line_items
- **events** ↔ **labor_types**: Many-to-many through event_labor_assignments
- **events** ↔ **roi_metrics**: Many-to-many through event_roi_metrics
- **locations** ↔ **labor_types**: Many-to-many through resource_capacity

## Data Types

- **UUID**: Universal Unique Identifier
- **TEXT**: Text strings
- **ENUM**: Enumerated type (predefined values)
- **BOOLEAN**: True/False values
- **INTEGER**: Whole numbers
- **DECIMAL**: Numeric values with decimal precision
- **TIMESTAMPTZ**: Timestamp with timezone
- **JSONB**: Binary JSON data
- **TEXT[]**: Array of text strings