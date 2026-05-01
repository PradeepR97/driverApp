# OLA Maps Documentation

## Directions API Overview

Directions API provides a robust solution for integrating precise and efficient routing and navigation functionalities into your applications. Whether you're developing a mapping application, a transportation logistics platform, or a location-based service, the API offers seamless integration to enhance user experiences and streamline operations.

With the Directions API, you can generate accurate and optimized routes between multiple waypoints, including:

- Detailed turn-by-turn directions
- Estimated travel times
- Alternative routes

This tool empowers users to plan their journeys effectively, whether navigating busy city streets or remote landscapes.

### Why Directions API?

Directions API provides routable path(s) with traffic data considerations, thereby providing optimal path(s). It can work with 2 or more points and also provide alternatives as required. There are multiple quality-of-service options controlled with the `overview` parameter.

### What can Directions API help with?

It helps solve the problem of finding an optimal path between a given set of points. This can solve geospatial problems of understanding the actual distance involved for a particular trip along with accurate duration. This is quintessential in ride-hailing services, food delivery services, courier services, and other planning-heavy use cases.

### How to use

Sample request:

```bash
curl --location --request POST "https://api.olamaps.io/routing/v1/directions?origin=18.76029027465273,73.3814242364375&destination=18.73354223011708,73.44587966939002&api_key=${your_api_key}" --header "X-Request-Id: XXX"
```

Sample request with waypoints:

```bash
curl --location --request POST "https://api.olamaps.io/routing/v1/directions?origin=18.76029027465273,73.3814242364375&destination=18.73354"
```

---

## Directions Basic API Overview

The Directions Basic API is an essential tool designed to integrate reliable routing and navigation functionalities into your applications. As the basic version of the Directions API, it provides an efficient way to generate accurate routes between multiple waypoints.

While it does not consider real-time traffic data, it still offers calculated ETAs, allowing users to plan their journeys with precision. This tool ensures users receive clear, detailed turn-by-turn directions and estimated travel times.

### Why Directions Basic API?

The Directions Basic API delivers precise routes between two or more points, guiding users step-by-step through their journeys for a smooth travel experience. This API supports multi-waypoint routing and ETA calculations based on standard conditions. It is simple to integrate and customize.

### What can Directions Basic API help with?

It supports geospatial tasks that require accurate distance calculations and route mapping. It is well-suited for daily commuting, travel, and multi-stop route planning (delivery routes, service visits, multi-leg trips) without requiring real-time traffic updates.

### How to use

Sample request:

```bash
curl --location --request POST "https://api.olamaps.io/routing/v1/directions/basic?origin=18.76029027465273,73.3814242364375&destination=18.73354223011708,73.44587966939002&api_key=${your_api_key}" --header "X-Request-Id: XXX"
```

Sample request with waypoints:

```bash
curl --location --request POST "https://api.olamaps.io/routing/v1/directions/basic?origin=18.76029027465273,73.3814242364375&destination=18.733"
```

---

## Distance Matrix API Overview

Distance Matrix API provides a robust solution for integrating precise routable distance and ETA between multiple points. Whether you're developing a mapping application, a transportation logistics platform, or a location-based service, this API helps streamline operations and user experiences.

With the Distance Matrix API, you can generate:

- Accurate and optimized distances
- Near real-time ETA
- Routable path between multiple points

### Why Distance Matrix API?

Distance Matrix API provides distance, near real-time ETA, and routable path(s) with traffic data considerations between multiple points. It is useful in scenarios where serviceable locations and assignees/engineers need time- and distance-efficient allocations.

### What can Distance Matrix API help with?

It solves the problem of finding all combinations of time and distance between multiple points. It is highly relevant for logistics, ride-hailing, food delivery, courier services, and field operations planning.

### How to use

Sample request:

```bash
curl --location --request GET "https://api.olamaps.io/routing/v1/distanceMatrix?origins=12.931627594462489%2C77.61594443652996%7C12.94526954617208%2C77.63695879085383&destinations=12.92526954617208%2C77.63695879085383%7C12.961627594462489%2C77.61594443652996&api_key=${your_api_key}" --header "X-Request-Id: XXX"
```

---

## Distance Matrix Basic API Overview

The Distance Matrix Basic API provides an essential solution for integrating accurate routable distances and estimated travel times between multiple points.

As a streamlined version, it offers precise route and distance calculations for route planning and job assignments without real-time traffic updates.

### Why Distance Matrix Basic API?

It is ideal for use cases that require accurate distance and route calculations without traffic overlays. It delivers reliable ETAs based on standard conditions and is simple to integrate.

### What can Distance Matrix Basic API help with?

It is well-suited for scenarios where businesses need all possible time and distance combinations between multiple points. This supports service planning and resource allocation efficiently across logistics, courier, ride-hailing, and field services.

### How to use

Sample request:

```bash
curl --location --request GET "https://api.olamaps.io/routing/v1/distanceMatrix/basic?origins=12.931627594462489%2C77.61594443652996%7C12.94526954617208%2C77.63695879085383&destinations=12.92526954617208%2C77.63695879085383%7C12.961627594462489%2C77.61594443652996&api_key=${your_api_key}" --header "X-Request-Id: XXX"
```

---

## Route Optimizer API Overview

Route Optimizer API offers a comprehensive solution for generating optimized routes tailored to application-specific needs. It is useful for logistics, deliveries, and navigation systems where precise and efficient route planning is required.

By analyzing real-time traffic data and road conditions, this API provides optimized routes between multiple locations with detailed directions and estimated travel times.

### Why Route Optimizer API?

Route Optimizer API calculates optimal routes by factoring in both distance and time. It can dynamically adjust to road conditions and provides ETA, distance, and detailed directions for efficient planning.

### What can Route Optimizer API help with?

It solves the challenge of determining optimal routes between multiple waypoints. Use cases include route planning for deliveries, fleet coordination, and navigation services where operational efficiency is important.

### How to use

Sample request:

```bash
curl --location --request POST "https://api.olamaps.io/routing/v1/routeOptimizer?locations=12.931931834732886,77.6150887031686|12.919538676698762,77.62190003303567|12.925134311034869,77.62847186475263|12.93413639725141,77.62570726799348|12.935162891812345,77.6095526173083&api_key=${your_api_key}" --header "X-Request-Id: XXX"
```

---

## Fleet Planner API Overview

Fleet Planner API manages and optimizes fleets of vehicles/equipment to ensure efficient and cost-effective operations. Key responsibilities include aggregating work, distributing tasks, and route optimization.

### Why Fleet Planner API?

Fleet planning is essential for logistical companies focused on efficiency and cost reduction. It helps quantify planned work through travel ETA and distance, while supporting different allocation strategies (optimization, time-bound allocation, fair work distribution).

### What can Fleet Planner API help with?

It helps solve allocation, distribution, and optimal path planning problems, especially for logistics, food delivery, and courier services.

### How to use

Sample request:

```bash
curl --location --request POST "https://api.olamaps.io/routing/v1/fleetPlanner?strategy=fair&api_key=${your_api_key}" --header "X-Request-Id: XXX" --form "input=@data.json;type=application/json"
```

### Input file schema

```json
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "properties": {
    "packages": {
      "type": "array",
      "items": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "weightInGrams": {
              "type": "integer"
            },
            "loadingLocation": {
              "type": "object",
              "properties": {
                "lat": {
                  "type": "number"
                },
                "lng": {
                  "type": "number"
                }
              },
              "required": [
                "lat",
                "lng"
              ]
            },
            "loadingTimeInMinutes": {
              "type": "integer"
            }
          },
          "required": [
            "id",
            "weightInGrams",
            "loadingLocation",
            "loadingTimeInMinutes"
          ]
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "weightInGrams": {
              "type": "integer"
            },
            "loadingLocation": {
              "type": "object",
              "properties": {
                "lat": {
                  "type": "number"
                },
                "lng": {
                  "type": "number"
                }
              },
              "required": [
                "lat",
                "lng"
              ]
            },
            "loadingTimeInMinutes": {
              "type": "integer"
            }
          },
          "required": [
            "id",
            "weightInGrams",
            "loadingLocation",
            "loadingTimeInMinutes"
          ]
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "weightInGrams": {
              "type": "integer"
            },
            "loadingLocation": {
              "type": "object",
              "properties": {
                "lat": {
                  "type": "number"
                },
                "lng": {
                  "type": "number"
                }
              },
              "required": [
                "lat",
                "lng"
              ]
            },
            "unloadingLocation": {
              "type": "object",
              "properties": {
                "lat": {
                  "type": "number"
                },
                "lng": {
                  "type": "number"
                }
              },
              "required": [
                "lat",
                "lng"
              ]
            },
            "unloadingTimeInMinutes": {
              "type": "integer"
            },
            "loadingTimeInMinutes": {
              "type": "integer"
            }
          },
          "required": [
            "id",
            "weightInGrams",
            "loadingLocation",
            "unloadingLocation",
            "unloadingTimeInMinutes",
            "loadingTimeInMinutes"
          ]
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "weightInGrams": {
              "type": "integer"
            },
            "loadingLocation": {
              "type": "object",
              "properties": {
                "lat": {
                  "type": "number"
                },
                "lng": {
                  "type": "number"
                }
              },
              "required": [
                "lat",
                "lng"
              ]
            },
            "loadingTimeInMinutes": {
              "type": "integer"
            }
          },
          "required": [
            "id",
            "weightInGrams",
            "loadingLocation",
            "loadingTimeInMinutes"
          ]
        }
      ]
    },
    "vehicles": {
      "type": "array",
      "items": [
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "capacityInKG": {
              "type": "integer"
            },
            "startTime": {
              "type": "object",
              "properties": {
                "hour": {
                  "type": "integer"
                },
                "minutes": {
                  "type": "integer"
                }
              },
              "required": [
                "hour",
                "minutes"
              ]
            },
            "endTime": {
              "type": "object",
              "properties": {
                "hour": {
                  "type": "integer"
                },
                "minutes": {
                  "type": "integer"
                }
              },
              "required": [
                "hour",
                "minutes"
              ]
            },
            "startLocation": {
              "type": "object",
              "properties": {
                "lat": {
                  "type": "number"
                },
                "lng": {
                  "type": "number"
                }
              },
              "required": [
                "lat",
                "lng"
              ]
            }
          },
          "required": [
            "id",
            "capacityInKG",
            "startTime",
            "endTime",
            "startLocation"
          ]
        },
        {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "capacityInKG": {
              "type": "integer"
            }
          },
          "required": [
            "id",
            "capacityInKG"
          ]
        }
      ]
    },
    "globalStartLocation": {
      "type": "object",
      "properties": {
        "lat": {
          "type": "number"
        },
        "lng": {
          "type": "number"
        }
      },
      "required": [
        "lat",
        "lng"
      ]
    }
  },
  "required": [
    "packages",
    "vehicles"
  ]
}
```

### Input object types

The input file comprises 2 types: `Vehicle` and `Package`.

#### Vehicle attributes

- `id`: A unique identifier to represent a vehicle. Only alphanumeric characters allowed; no special characters. (required, datatype: string)
- `capacityInKG`: Loading capacity of the vehicle in kilograms. (required, datatype: number)
- `startTime`: Needed if a vehicle has working hours. Represents duty start time (`hour` + `minutes`, 24-hour format). (optional)
- `endTime`: Needed if a vehicle has working hours. Represents duty end time (`hour` + `minutes`, 24-hour format). (optional)

#### Package attributes

- `id`: A unique identifier to represent a package. Only alphanumeric characters allowed; no special characters. (required, datatype: string)
- `weightInGrams`: Weight of the package in grams. (required, datatype: number)
- `loadingLocation`: Pickup location with `lat` and `lng`.
- `unloadingLocation`: Drop location with `lat` and `lng`.
- `loadingTimeInMinutes`: Time needed to load a package into the vehicle. (optional, datatype: number)
- `unloadingTimeInMinutes`: Time needed to unload a package from the vehicle. (optional, datatype: number)

### Sample input file

```json
{
  "packages": [
    {
      "id": "package1",
      "weightInGrams": 2000,
      "loadingLocation": {
        "lat": 12.988063387888786,
        "lng": 77.55078360931566
      },
      "loadingTimeInMinutes": 0
    },
    {
      "id": "package2",
      "weightInGrams": 1500,
      "loadingLocation": {
        "lat": 12.788063387888785,
        "lng": 77.95078360931566
      },
      "loadingTimeInMinutes": 0
    },
    {
      "id": "package3",
      "weightInGrams": 1200,
      "loadingLocation": {
        "lat": 13.050973936977373,
        "lng": 77.54251919913526
      },
      "unloadingLocation": {
        "lat": 12.958624721413775,
        "lng": 77.59886345950845
      },
      "unloadingTimeInMinutes": 0,
      "loadingTimeInMinutes": 0
    }
  ],
  "vehicles": [
    {
      "id": "MHXXAAYYYY",
      "capacityInKG": 2,
      "startTime": {
        "hour": 11,
        "minutes": 0
      },
      "endTime": {
        "hour": 12,
        "minutes": 25
      }
    },
    {
      "id": "MHXXBBYYYY",
      "capacityInKG": 2
    }
  ]
}
```

---

## Map SDK — iOS

Ola Map SDK offers a robust toolkit for seamlessly integrating both basic and advanced mapping features into your iOS applications. By utilizing the Maps SDK for iOS, you can incorporate maps powered by Ola's data directly into your app. The SDK takes care of displaying the map and responding to user interactions like clicks and drags. Additionally, you can enhance your maps by adding markers, polylines, ground overlays, and info windows, which provide extra information for specific locations and enable user interaction with the map.

### Specifications

Before proceeding, ensure that you meet the following prerequisites:

- **Minimum iOS version:** iOS 13.0
- **Xcode version:** 12 or later

### Sample app

Please refer to the **GitHub Sample App** for better clarity on the same.

### Set up

Import all the **xcframeworks** into your iOS project. Embed all frameworks under **General → Frameworks, Libraries and Embedded Content**.

Add location permission keys in **Info.plist**:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>App wants to access your location</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>App wants to access your location</string>
```

Initialize the `OlaMapService` instance in your view controller. Load the map using the service instance — ideally call this in `viewDidLoad()` of the view controller.

### Features

- Dynamic maps
- Camera and view
- Polyline
- Shape
- Marker
- Info window
- Map events and gestures
- Traffic polyline
- Marker clustering

### Dynamic map

To render a map, initialise `OlaMapService` first, then call `loadMap(_:)`.

```swift
private let olaMap = OlaMapService(
    auth: .apiKey(key: "<API-KEY-FROM-DASHBOARD>"),
    tileURL: URL(string: "<TILE-URL-FROM-DASHBOARD>"),
    projectId: "WORKSPACE-ID"
)
olaMap.loadMap(onView: self.view)
olaMap.addCurrentLocationButton(self.view)
olaMap.setCurrentLocationMarkerColor(UIColor.systemBlue)
olaMap.setDebugLogs(true)
olaMap.delegate = self
olaMap.setMaxZoomLevel(16.0)
```

| Parameter | Description |
|-----------|-------------|
| `apiKey` | API key from Ola Maps Dashboard |
| `tileURL` | Refer Tiles API in API Reference |
| `projectId` | Project identifier from Dashboard |
| `userId` | Custom user ID identified by your organization |

### Map camera

Control the map POV and bounds.

```swift
// Set camera with single coordinate
olaMap.setCamera(at: OlaCoordinate(latitude: 12.93177, longitude: 77.616370000000003), zoomLevel: 16.0)

// Set camera with array of coordinates
let polylineSetOlaToKormangla: [OlaCoordinate] = [
    OlaCoordinate(latitude: 12.93177, longitude: 77.616370000000003),
    OlaCoordinate(latitude: 12.93168, longitude: 77.616870000000006)
]
olaMap.setMapCamera(polylineSetOlaToKormangla, UIEdgeInsets(top: 8, left: 8, bottom: 8, right: 8))
```

### Events and gestures

Enable rotation with two fingers:

```swift
olaMap.setRotatingGesture(true)
```

Implement `OlaMapServiceDelegate` callbacks:

```swift
func didTapOnMap(_ coordinate: OlaCoordinate) {
    // If you tap on tile
}

func didTapOnMap(feature: POIModel) {
    // If you tap on any POI
}

func didLongTapOnMap(_ coordinate: OlaCoordinate) {
    // If you long press on tile
}

func didChangeCamera() {
    print("Map Camera Change")
}

func mapSuccessfullyLoaded() {
    print("Map Loaded Successfully")
}

func mapSuccessfullyLoadedStyle() {
    print("Map Loaded Style")
}
```

### Info window

Draw a tooltip-style view on the map:

```swift
let toolTipId = "tool-tip"
let infoWindow = InfoAnnotationView(
    identifier: toolTipId,
    model: InfoAnnotationDecorator(),
    text: "I'm at OlaCampus",
    isActive: true
)
self.olaMap.setAnnotationMarker(at: self.olaCampus, annotationView: infoWindow, identifier: toolTipId)
```

Remove:

```swift
olaMap.removeAnnotation(by: "Annotation-ID")
```

### Map region bounds

Control visible bounds from an array of coordinates:

```swift
self.olaMap.setMapCamera([coordinate1, coordinate2])
```

### Marker

**Create annotation marker** — use `CustomAnnotationView` (inherits from `OlaAnnotation`):

```swift
let cabAnnotation = CustomAnnotationView(identifier: identifier, image: UIImage(named: "IMAGE_NAME"))
cabAnnotation.bounds = CGRect(x: 0, y: 0, width: 40, height: 40)
cabAnnotation.setRotate(Double(Int.random(in: 0...360))) // bearing for cab
olaMap.setAnnotationMarker(at: coordinate, annotationView: cabAnnotation, identifier: cabAnnotation.identifier)
```

**Delete annotation:**

```swift
olaMap.removeAnnotation(by: "Annotation-ID")
```

### Polyline

Use an array of `OlaCoordinate` for a solid polyline.

**Create:**

```swift
let polylineSetOlaToKormangla: [OlaCoordinate] = [
    OlaCoordinate(latitude: 12.93177, longitude: 77.616370000000003),
    OlaCoordinate(latitude: 12.93168, longitude: 77.616870000000006),
    OlaCoordinate(latitude: 12.931610000000001, longitude: 77.616900000000001),
    OlaCoordinate(latitude: 12.931000000000001, longitude: 77.616770000000002),
    OlaCoordinate(latitude: 12.93097, longitude: 77.616709999999997),
    OlaCoordinate(latitude: 12.931480000000001, longitude: 77.614249999999998),
    OlaCoordinate(latitude: 12.93075, longitude: 77.614389999999986),
    OlaCoordinate(latitude: 12.93022, longitude: 77.61472999999998),
    OlaCoordinate(latitude: 12.92999, longitude: 77.614869999999982),
    OlaCoordinate(latitude: 12.929869999999999, longitude: 77.614949999999979),
    OlaCoordinate(latitude: 12.92981, longitude: 77.615049999999982),
    OlaCoordinate(latitude: 12.92975, longitude: 77.615239999999985),
]

self.olaMap.showPolyline(identifier: "polyline-id", .solid, polylineSetOlaToKormangla, .darkGray)
```

**Delete:**

```swift
self.olaMap.deletePolyline("polyline-id")
```

### Shape

Polygon or circle geometry.

**Create polygon:**

```swift
let coordinates: [OlaCoordinate] = [
    OlaCoordinate(latitude: 12.9320745, longitude: 77.6137873),
    OlaCoordinate(latitude: 12.931336, longitude: 77.6141494),
    OlaCoordinate(latitude: 12.9308027, longitude: 77.6167565),
    OlaCoordinate(latitude: 12.9317333, longitude: 77.6170891),
    OlaCoordinate(latitude: 12.9322679, longitude: 77.6142218),
    OlaCoordinate(latitude: 12.9320745, longitude: 77.6137873),
]
let strokeColor: UIColor = UIColor.black
let strokeWidth: CGFloat = 2.5
let zoneColor: UIColor = UIColor.systemGreen.withAlphaComponent(0.25)

olaMap.drawPolygon(identifier: "polygon-id", coordinates, zoneColor: zoneColor, strokeColor: strokeColor, storkeWidth: strokeWidth)
olaMap.setMapCamera(coordinates)
```

**Remove polygon:**

```swift
self.olaMap.deletePolygon("polygon-id")
```

For circles, use `drawCircle(_:)`.

### Traffic polyline

Segmented polyline from Directions API response:

```swift
let polylineEncodedString = "ss|mAcpvxM}@KE@EFKfAAB?DQlACRQ`B?FCTKt@CNOlAANE\?\HVJTNXy@\QF]NoA{CiByEi@sAEKCCO[Uc@q@mAVq@WCqBQwEg@_BKEAOAG@mCg@m@M"
let trafficCongestions = "0,3,0|3,4,0|4,5,0|5,7,0|7,8,0|8,10,10|10,12,10|12,14,10|14,15,10|15,16,0|16,19,5|19,21,5|21,23,0|23,24,0|24,25,0|25,26,0|26,28,0|28,30,5|30,31,5|31,33,5|33,35,5|35,36,5|36,38,5|38,39,5|39,40,0|40,41,0|41,44,0|44,45,0|45,47,0|47,48,5|48,49,5|49,50,0|50,51,0|51,52,0|52,53,0|53,54,0|54,55,0|55,56,0|56,57,0|57,58,0"
self.olaMap.showTrafficPolyline(encodedPolyline: polylineEncodedString, travelAdvisory: trafficCongestions) { polylineID in
    print("Segmented PolylineID: \(polylineID)")
}
```

### Marker clustering

Cluster nearby markers with a label. Use `ClusterViewDecorator` for appearance:

- `backgroundColor` — cluster view background
- `opacity` — cluster view opacity
- `radius` — cluster zone radius
- `cluserViewRadius` — cluster view radius (SDK spelling)
- `borderWidth` / `borderColor` — cluster view border
- `fontSize` / `fontColor` — label on cluster

```swift
let coordinates: [OlaCoordinate] = [
    OlaCoordinate(latitude: 12.9320745, longitude: 77.6137873),
    OlaCoordinate(latitude: 12.931336, longitude: 77.6141494),
    OlaCoordinate(latitude: 12.9308027, longitude: 77.6167565),
    OlaCoordinate(latitude: 12.9317333, longitude: 77.6170891),
    OlaCoordinate(latitude: 12.9322679, longitude: 77.6142218),
    OlaCoordinate(latitude: 12.9320749, longitude: 77.6137873),
]

let clusterMarkers = coordinates.map { coordinate in
    ClusterMarker(markerId: coordinate.description, image: UIImage(named: "car")!, coordinate: coordinate)
}

self.olaMap.drawClusterMarker(
    clusterMarkers,
    clusterDecorator: ClusterViewDecorator(
        backgroundColor: UIColor.lightGray,
        opacity: 0.5,
        radius: 50,
        cluserViewRadius: 10,
        borderWidth: 1,
        borderColor: UIColor.darkGray,
        fontSize: 16,
        fontColor: UIColor.red
    )
)

self.olaMap.setCamera(at: self.olaCampus, zoomLevel: 20)
```

**Clear clusters:**

```swift
self.olaMap.clearCluster()
```

---

## Map SDK — Android

Ola Map Android SDK provides interactive map functionality powered by Ola's data.

### Sample app

Please refer to the **GitHub Sample App** for clarity.

### Setting up the SDK

1. **Download SDK** — download the Android Map SDK from the official link and copy the AAR into your `libs` folder.
2. **Add dependency** in `build.gradle`:

```gradle
// OlaMap SDK
implementation(files("libs/OlaMapSdk-1.0.0.aar"))

// MapLibre
implementation("org.maplibre.gl:android-sdk:11.13.1")
implementation("org.maplibre.gl:android-plugin-annotation-v9:3.0.2")
implementation("org.maplibre.gl:android-plugin-markerview-v9:3.0.2")
```

### Layout

```xml
<com.ola.mapsdk.view.OlaMapView
    android:id="@+id/mapView"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

### Map view initialization

```kotlin
mapView = findViewById(R.id.mapView)

mapView.getMap(
    apiKey = "<API KEY>",
    olaMapCallback = object : OlaMapCallback {
        override fun onMapReady(olaMap: OlaMap) {
            // Map is ready
        }

        override fun onMapError(error: String) {
            // Handle error
        }
    },
    mapControlSettings = MapControlSettings.Builder().build()
)
```

### Features overview

- Dynamic maps (scroll, zoom, rotate, tilt, current location)
- Markers
- Info windows
- Polyline
- Circle
- Polygon
- Bezier curve
- Events and methods
- Controls and gestures
- Marker clustering

### 1. Markers

**Add:**

```kotlin
val markerOptions1 = OlaMarkerOptions.Builder()
    .setMarkerId("marker1")
    .setPosition(OlaLatLng(18.52145653681468, 73.93178277572254))
    .setIsIconClickable(true)
    .setIconRotation(0f)
    .setIsAnimationEnable(true)
    .setIsInfoWindowDismissOnClick(true)
    .build()

marker1 = olaMap.addMarker(markerOptions1)
```

| Builder method | Description |
|----------------|---------------|
| `setMarkerId` | Unique marker id |
| `setPosition` | `OlaLatLng` position |
| `setIsIconClickable` | Icon tap enabled |
| `setIconRotation` | Icon rotation (degrees) |
| `setIsAnimationEnable` | Marker animations |
| `setIsInfoWindowDismissOnClick` | Dismiss info window on tap |

**Remove:** `marker1.removeMarker()`

**Update:**

```kotlin
marker1.updateMarker(
    position = OlaLatLng(...),
    iconAnchor = "top-left",
    iconBitmap = customBitmap,
    iconIntRes = R.drawable.custom_icon,
    iconOffset = floatArrayOf(10f, 20f),
    iconRotation = 45f,
    iconSize = 1.5f,
    snippet = "Updated snippet text",
    subSnippet = "Updated sub-snippet text"
)
```

### 2. Info windows

Add via marker options with `setSnippet`, then `addMarker`. **Hide:** `marker1.hideInfoWindow()`. **Update text:** `marker1.updateInfoWindow("This is an updated info window")`.

### 3. Polyline

```kotlin
val points = arrayListOf(
    OlaLatLng(12.931423492103944, 77.61648476788898),
    OlaLatLng(12.931758797710456, 77.61436504365439)
)

val polylineOptions = OlaPolylineOptions.Builder()
    .setPolylineId("pid1")
    .setPoints(points)
    .build()

polyline1 = olaMap.addPolyline(polylineOptions)
```

Optional: `setColor`, `setLineType`, `setWidth`. **Remove:** `polyline.removePolyline()`. **Update points:** `polyline.setPoints(newPoints)`.

### 4. Circle

```kotlin
val olaCampus = OlaLatLng(12.931423492103944, 77.61648476788898)
val circleOptions = OlaCircleOptions.Builder()
    .setOlaLatLng(olaCampus)
    .setRadius(100f)
    .build()

circle = olaMap.addCircle(circleOptions)
```

Also: `setCenter`, `setColor`, `setBlur`, `setBorderOptions`, `setOpacity`. **Remove:** `circle.removeCircle()`. **Update:** e.g. `circle.setColor("#FF0000")`.

### 5. Polygon

```kotlin
val points = arrayListOf(
    OlaLatLng(18.56892987516166, 73.88081911869274),
    OlaLatLng(18.58960286647498, 73.83615669644608)
)
val polygonOptions = OlaPolygonOptions.Builder()
    .setPolygonId("polygon1")
    .setPoints(points)
    .build()

polygon = olaMap.addPolygon(polygonOptions)
```

**Remove:** `polygon.removePolygon()`. **Update:** `polygon.setPoints(newPoints)`, `polygon.setColor("#FF0000")`.

### 6. Bezier curve

```kotlin
val startPoint = OlaLatLng(12.931423492103944, 77.61648476788898)
val endPoint = OlaLatLng(12.931758797710456, 77.61436504365439)

val bezierCurveOptions = BezierCurveOptions.Builder()
    .setCurveId("bcurve1")
    .setStartPoint(startPoint)
    .setEndPoint(endPoint)
    .build()

bezierCurve = olaMap.addBezierCurve(bezierCurveOptions)
```

**Remove:** `bezierCurve.removeBezierCurve()`. **Update:** `bezierCurve.setPoints(newStartPoint, newEndPoint)`, `bezierCurve.setLineType(LineType.LINE_SOLID)` or `LINE_DOTTED`.

### 7. Events and methods

- **Zoom to location:** `olaMap.zoomToLocation(location, zoomLevel)`
- **Current location:** `val currentLocation: OlaLatLng? = olaMap?.getCurrentLocation()`
- **Show / hide user location:** `olaMap?.showCurrentLocation()` / `olaMap?.hideCurrentLocation()`

### 8. Controls and gestures

```kotlin
val mapControlSettings = MapControlSettings.Builder()
    .setRotateGesturesEnabled(true)
    .setScrollGesturesEnabled(true)
    .setZoomGesturesEnabled(false)
    .setCompassEnabled(true)
    .setTiltGesturesEnabled(true)
    .setDoubleTapGesturesEnabled(true)
    .build()

mapView.getMap(apiKey = "<API KEY>", olaMapCallback = object : OlaMapCallback {}, mapControlSettings)
```

### 9. Marker clustering

**FeatureCollection:**

```kotlin
val featureCollection: FeatureCollection = // your FeatureCollection
val clusterOptions = OlaMarkerClusterOptions.Builder()
    .setClusterRadius(50)
    .setDefaultMarkerColor("#FF0000")
    .setDefaultClusterColor("#00FF00")
    .setDefaultMarkerIcon(bitmap)
    .setTextSize(12f)
    .setTextColor("#FFFFFF")
    .build()

val clusteredMarkers = olaMap.addClusteredMarkers(clusterOptions, featureCollection)
```

**GeoJSON string:**

```kotlin
val geoJson: String = // your GeoJSON
val clusterOptions = OlaMarkerClusterOptions.Builder()
    .setClusterRadius(50)
    .setDefaultMarkerColor("#FF0000")
    .setDefaultClusterColor("#00FF00")
    .setTextSize(12f)
    .setTextColor("#FFFFFF")
    .build()

val clusteredMarkers = olaMap?.addClusteredMarkers(clusterOptions, geoJson)
```

`OlaMarkerClusterOptions`: `clusterRadius`, `defaultMarkerColor`, `defaultClusterColor`, `defaultMarkerIcon`, `stop1Color` / `stop2Color` (cluster background stops), `textSize`, `textColor`.

**Update:** `clusteredMarkers.updateClusteredMarkers(newFeatureCollection, newClusterOptions)` or with GeoJSON string.

**Remove:** `clusteredMarkers.removeClusteredMarkers()`

---

## Geocoding API

Geocoding API translates human-readable place names and addresses into geographic coordinates (latitude and longitude). It supports street addresses, cities, and POIs for mapping, logistics, and location-based apps.

### Why Geocoding API?

Forward geocoding turns text addresses and place names into coordinates — essential for maps, navigation, and accurate location workflows.

### What can it help with?

Route planning, location search, delivery logistics, and any flow that needs coordinates from text.

### How to use

Sample request:

```bash
curl --location "https://api.olamaps.io/places/v1/geocode?address=Ola Electric, 2, Hosur Rd, Koramangala Industrial Layout, Koramangala, Bengaluru, 560095, Karnataka&language=hi&api_key=${your_api_key}" --header "X-Request-Id: XXX"
```

Refer to the **API documentation** for full parameter and response details.
