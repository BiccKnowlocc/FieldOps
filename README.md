# FieldOps

Construction field operations app for foremen and office staff. Native on phone/tablet (Expo) and a desktop office view in the browser.

**This slice is live:** daily site logs, punch lists, and photo capture with timestamp, GPS, and markup. Data stays on the device (SQLite on native, IndexedDB on web) and syncs with conflict resolution when a connection returns.

The other modules — equipment, estimating, labor/dispatch, and safety — are in the app shell so they can be filled in next.

## Run it

```bash
cd FieldOps
npm install
npm run web          # office view in the browser (widen the window for the sidebar)
npm start            # Expo Go / Android / iOS
```

On Windows, `npm run android` after USB debugging or an emulator.

## Field workflow

1. **Today** — start or continue the daily log, see open punch items, capture photos.
2. **Logs** — weather, crew, work completed, visitors, deliveries, delays (weather hold, trade conflict, and so on). Large chips, almost no typing.
3. **Punch** — assign to a trade/sub, set priority and due date, attach before/after photos. Close-out requires an after photo.
4. **Photos** — camera or library, automatic timestamp + GPS, draw / arrow / highlight markup, attach to a log or punch item.
5. **More** — jobsite switcher, manual sync, conflict resolution. Use **Simulate office conflict** then **Sync now** to try keep-field vs keep-office.

Widen the window past 960px for the office sidebar (all five product areas).

## Offline sync

Records are written locally first (`pending`). When the device is online, they copy into a local remote mirror. If field and office both edited the same record, you choose which copy to keep.
