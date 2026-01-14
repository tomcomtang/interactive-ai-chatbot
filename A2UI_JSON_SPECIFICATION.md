# A2UI JSON Format Specification

## Overview

A2UI (Agent-to-User Interface) is a declarative UI protocol designed for AI agents to generate dynamic user interfaces. This specification extends the official A2UI v0.9 standard with additional components supported by this project.

## Message Types

### 1. Create Surface
Creates a new UI surface with components and data model.

```json
{
  "type": "createSurface",
  "surfaceId": "unique_surface_id",
  "dataModel": {
    // Data object that components can bind to
  },
  "components": [
    // Array of component definitions
  ]
}
```

### 2. Update Components
Updates component definitions on an existing surface.

```json
{
  "type": "updateComponents", 
  "surfaceId": "existing_surface_id",
  "components": [
    // Updated component definitions
  ]
}
```

### 3. Update Data Model
Updates data values that components are bound to.

```json
{
  "type": "updateDataModel",
  "surfaceId": "existing_surface_id", 
  "path": "/data/path",
  "value": "new_value"
}
```

### 4. Delete Surface
Removes a UI surface completely.

```json
{
  "type": "deleteSurface",
  "surfaceId": "surface_to_delete"
}
```

## Component Categories

### Basic Components

#### Text
Displays text content with various styling options.

```json
{
  "type": "Text",
  "id": "unique_id",
  "text": "Display text or /data/path",
  "size": "small|medium|large|extraLarge", 
  "variant": "h1|h2|h3|h4|h5|body|caption",
  "style": {
    "color": "#ffffff",
    "fontWeight": "400|500|600|700",
    "textAlign": "left|center|right"
  },
  "dataBinding": "/data/path"
}
```

#### Image
Displays images with various size variants.

```json
{
  "type": "Image", 
  "id": "unique_id",
  "url": "https://example.com/image.jpg or /data/path",
  "alt": "Alternative text",
  "width": "80px",
  "height": "80px", 
  "variant": "icon|avatar|smallFeature|mediumFeature|largeFeature|header",
  "fit": "contain|cover|fill|none|scale-down",
  "dataBinding": "/data/path"
}
```

#### Button
Interactive button with action handling.

```json
{
  "type": "Button",
  "id": "unique_id", 
  "text": "Button Text",
  "variant": "primary|secondary|outline|ghost",
  "size": "small|medium|large",
  "disabled": false,
  "action": {
    "type": "submit|navigate|custom",
    "target": "/path/or/url",
    "data": {}
  }
}
```

#### Divider
Visual separator line.

```json
{
  "type": "Divider",
  "id": "unique_id",
  "direction": "horizontal|vertical",
  "style": {
    "color": "#rgba(255,255,255,0.2)",
    "thickness": "1px"
  }
}
```

### Layout Components

#### Row
Horizontal layout container.

```json
{
  "type": "Row", 
  "id": "unique_id",
  "alignment": "start|center|end|stretch",
  "distribution": "start|center|end|spaceBetween|spaceAround|spaceEvenly",
  "gap": "8px|12px|16px|24px",
  "children": ["child_id_1", "child_id_2"]
}
```

#### Column
Vertical layout container.

```json
{
  "type": "Column",
  "id": "unique_id", 
  "alignment": "start|center|end|stretch",
  "distribution": "start|center|end|spaceBetween|spaceAround|spaceEvenly",
  "gap": "8px|12px|16px|24px",
  "children": ["child_id_1", "child_id_2"]
}
```

#### Card
Container with elevation and styling.

```json
{
  "type": "Card",
  "id": "unique_id",
  "elevation": 0|1|2|3|4,
  "padding": "8px|12px|16px|24px",
  "background": "#rgba(255,255,255,0.1)",
  "borderRadius": "8px|12px|16px",
  "children": ["child_id_1", "child_id_2"]
}
```

#### List
Scrollable list container.

```json
{
  "type": "List",
  "id": "unique_id",
  "direction": "vertical|horizontal", 
  "scrollable": true,
  "gap": "8px|12px|16px",
  "children": ["item_1", "item_2", "item_3"]
}
```

### Form Components

#### TextField
Text input field with validation.

```json
{
  "type": "TextField",
  "id": "unique_id",
  "label": "Field Label",
  "placeholder": "Enter text...",
  "value": "/data/path",
  "variant": "shortText|longText|number|email|password|url",
  "required": true,
  "disabled": false,
  "validation": {
    "minLength": 3,
    "maxLength": 100,
    "pattern": "regex_pattern",
    "errorMessage": "Validation error message"
  },
  "dataBinding": "/data/path"
}
```

#### CheckBox
Boolean checkbox input.

```json
{
  "type": "CheckBox", 
  "id": "unique_id",
  "label": "Checkbox Label",
  "checked": false,
  "disabled": false,
  "dataBinding": "/data/path"
}
```

#### Slider
Numeric range slider.

```json
{
  "type": "Slider",
  "id": "unique_id",
  "min": 0,
  "max": 100, 
  "step": 1,
  "value": 50,
  "label": "Slider Label",
  "showValue": true,
  "dataBinding": "/data/path"
}
```

### Data Display Components

#### Table
Data table with columns and rows.

```json
{
  "type": "Table",
  "id": "unique_id",
  "columns": [
    {
      "key": "name",
      "title": "Name", 
      "width": "200px",
      "sortable": true
    },
    {
      "key": "email",
      "title": "Email",
      "width": "250px"
    }
  ],
  "data": "/data/tableData",
  "pagination": {
    "pageSize": 10,
    "showPagination": true
  },
  "dataBinding": "/data/path"
}
```

#### Chart
Data visualization chart.

```json
{
  "type": "Chart",
  "id": "unique_id",
  "chartType": "bar|line|pie|area|scatter",
  "data": "/data/chartData",
  "config": {
    "title": "Chart Title",
    "xAxis": {
      "label": "X Axis",
      "key": "x"
    },
    "yAxis": {
      "label": "Y Axis", 
      "key": "y"
    },
    "colors": ["#6633ee", "#8b5cf6", "#a855f7"]
  },
  "dataBinding": "/data/path"
}
```

#### Progress
Progress indicator.

```json
{
  "type": "Progress",
  "id": "unique_id",
  "value": 75,
  "max": 100,
  "variant": "linear|circular",
  "size": "small|medium|large",
  "showValue": true,
  "color": "#6633ee",
  "dataBinding": "/data/path"
}
```

#### Badge
Small status indicator.

```json
{
  "type": "Badge",
  "id": "unique_id", 
  "text": "Badge Text",
  "variant": "default|success|warning|error|info",
  "size": "small|medium|large"
}
```

#### Statistic
Numeric statistic display.

```json
{
  "type": "Statistic",
  "id": "unique_id",
  "title": "Statistic Title",
  "value": 1234,
  "suffix": "units",
  "prefix": "$",
  "precision": 2,
  "trend": {
    "direction": "up|down|neutral",
    "value": 12.5,
    "label": "vs last month"
  },
  "dataBinding": "/data/path"
}
```

### Media Components

#### Video
Video player component.

```json
{
  "type": "Video",
  "id": "unique_id",
  "url": "https://example.com/video.mp4",
  "poster": "https://example.com/poster.jpg",
  "controls": true,
  "autoplay": false,
  "muted": false,
  "width": "100%",
  "height": "300px"
}
```

#### Audio
Audio player component.

```json
{
  "type": "Audio", 
  "id": "unique_id",
  "url": "https://example.com/audio.mp3",
  "controls": true,
  "autoplay": false,
  "title": "Audio Title"
}
```

#### Gallery
Image gallery with navigation.

```json
{
  "type": "Gallery",
  "id": "unique_id",
  "images": [
    {
      "url": "https://example.com/image1.jpg",
      "alt": "Image 1",
      "caption": "Image caption"
    }
  ],
  "variant": "grid|carousel|masonry",
  "columns": 3,
  "gap": "16px",
  "dataBinding": "/data/path"
}
```

### Advanced Components

#### Calendar
Date picker and calendar display.

```json
{
  "type": "Calendar",
  "id": "unique_id",
  "value": "2024-01-15",
  "mode": "single|range|multiple",
  "minDate": "2024-01-01", 
  "maxDate": "2024-12-31",
  "events": "/data/events",
  "dataBinding": "/data/path"
}
```

#### Timeline
Chronological event timeline.

```json
{
  "type": "Timeline",
  "id": "unique_id",
  "items": [
    {
      "date": "2024-01-15",
      "title": "Event Title",
      "description": "Event description",
      "type": "milestone|event|task"
    }
  ],
  "direction": "vertical|horizontal",
  "dataBinding": "/data/path"
}
```

#### Tree
Hierarchical tree structure.

```json
{
  "type": "Tree",
  "id": "unique_id", 
  "data": [
    {
      "id": "1",
      "title": "Root Node",
      "children": [
        {
          "id": "1-1", 
          "title": "Child Node"
        }
      ]
    }
  ],
  "expandable": true,
  "selectable": true,
  "dataBinding": "/data/path"
}
```

#### Carousel
Content carousel/slider.

```json
{
  "type": "Carousel",
  "id": "unique_id",
  "items": ["item_1", "item_2", "item_3"],
  "autoplay": false,
  "interval": 3000,
  "showDots": true,
  "showArrows": true,
  "infinite": true
}
```

## Data Binding

### Path Syntax
- **Absolute paths**: `/user/name` - resolves from root data model
- **Relative paths**: `name` - resolves within template scope

### Dynamic Values
Components support dynamic values through data binding:

```json
{
  "text": "/user/name",           // Direct path binding
  "text": "Hello /user/name",    // Template string
  "visible": "/user/isActive"  // Boolean binding
}
```

### Data Model Structure
```json
{
  "dataModel": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com",
      "isActive": true,
      "stats": {
        "projects": 42,
        "followers": 1234
      }
    },
    "products": [
      {
        "id": 1,
        "name": "Product 1",
        "price": 99.99
      }
    ]
  }
}
```

## Styling System

### Common Style Properties
```json
{
  "style": {
    "color": "#ffffff",
    "backgroundColor": "#6633ee", 
    "fontSize": "16px",
    "fontWeight": "600",
    "textAlign": "center",
    "padding": "16px",
    "margin": "8px",
    "borderRadius": "8px",
    "border": "1px solid #ccc",
    "boxShadow": "0 2px 8px rgba(0,0,0,0.1)"
  }
}
```

### Responsive Design
```json
{
  "responsive": {
    "mobile": {
      "width": "100%",
      "fontSize": "14px"
    },
    "tablet": {
      "width": "50%", 
      "fontSize": "16px"
    },
    "desktop": {
      "width": "33.33%",
      "fontSize": "18px"
    }
  }
}
```

## Actions and Events

### Action Types
```json
{
  "action": {
    "type": "submit",           // Submit form data
    "target": "/api/submit",
    "method": "POST",
    "data": "/form/data"
  }
}
```

```json
{
  "action": {
    "type": "navigate",         // Navigate to URL
    "target": "/dashboard",
    "newWindow": false
  }
}
```

```json
{
  "action": {
    "type": "updateData",       // Update data model
    "path": "/user/status", 
    "value": "active"
  }
}
```

## Validation

### Field Validation
```json
{
  "validation": {
    "required": true,
    "minLength": 3,
    "maxLength": 50,
    "pattern": "^[a-zA-Z0-9]+$",
    "custom": {
      "function": "validateEmail",
      "message": "Please enter a valid email"
    }
  }
}
```

## Complete Example

```json
{
  "type": "createSurface",
  "surfaceId": "user_profile_card",
  "dataModel": {
    "user": {
      "name": "Alex Chen",
      "title": "Senior Designer", 
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      "email": "alex@example.com",
      "stats": {
        "projects": 42,
        "followers": 1234
      }
    }
  },
  "components": [
    {
      "type": "Card",
      "id": "profile_card",
      "elevation": 2,
      "children": [
        {
          "type": "Row", 
          "id": "header_row",
          "alignment": "start",
          "gap": "16px",
          "children": [
            {
              "type": "Image",
              "id": "avatar",
              "url": "/user/avatar",
              "variant": "avatar",
              "width": "80px",
              "height": "80px"
            },
            {
              "type": "Column",
              "id": "info_column", 
              "alignment": "start",
              "children": [
                {
                  "type": "Text",
                  "id": "name",
                  "text": "/user/name",
                  "size": "extraLarge",
                  "style": { "fontWeight": "600" }
                },
                {
                  "type": "Text", 
                  "id": "title",
                  "text": "/user/title",
                  "size": "medium",
                  "style": { "color": "rgba(255,255,255,0.7)" }
                }
              ]
            }
          ]
        },
        {
          "type": "Divider",
          "id": "divider",
          "direction": "horizontal"
        },
        {
          "type": "Row",
          "id": "stats_row",
          "distribution": "spaceEvenly", 
          "children": [
            {
              "type": "Statistic",
              "id": "projects_stat",
              "title": "Projects",
              "value": "/user/stats/projects"
            },
            {
              "type": "Statistic", 
              "id": "followers_stat",
              "title": "Followers",
              "value": "/user/stats/followers"
            }
          ]
        }
      ]
    }
  ]
}
```

This specification provides a comprehensive guide for generating A2UI JSON that works with this project's extended component library.