import { Location } from './Location.js'
import { MeetingRoomLocation } from './MeetingRoomLocation.js'
import { OfficeLocation } from './OfficeLocation.js'
import { ServerRoomLocation } from './ServerRoomLocation.js'

const registry = {
    meeting_room: MeetingRoomLocation,
    office: OfficeLocation,
    server_room: ServerRoomLocation
}

export function createLocation(data, match) {
    const LocationClass = registry[data.behaviorKey ?? data.locationId] ?? Location
    return new LocationClass(data, match)
}

export function registerLocation(locationId, LocationClass) {
    registry[locationId] = LocationClass
}

export {
    Location,
    MeetingRoomLocation,
    OfficeLocation,
    ServerRoomLocation
}
