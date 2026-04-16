# Litoho CLI

คู่มือนี้สรุปคำสั่ง CLI ที่มีอยู่ใน framework ตอนนี้จาก implementation จริงใน `packages/cli/src/index.ts`

CLI หลักคือ `litoho`

ตัวอย่างการเรียกผ่าน package manager:

```bash
pnpm exec litoho --help
npm exec litoho -- --help
```

## Overview

คำสั่งระดับบนสุดที่มีตอนนี้:

- `litoho new <name>`
- `litoho dev [--root <dir>]`
- `litoho build [--root <dir>]`
- `litoho start [--root <dir>]`
- `litoho doctor [--root <dir>]`
- `litoho generate ...`
- `litoho g ...`
- `litoho ui ...`
- `litoho add ui ...`
- `litoho a ui ...`

ค่า default ของ `--root` คือ directory ปัจจุบัน

## Core Commands

### `litoho new <name>`

สร้างแอป Litoho ใหม่พร้อมโครงสร้างพื้นฐาน เช่น `app/pages`, `app/api`, `server.ts`, `vite.config.ts`, `src/main.ts`

ตัวอย่าง:

```bash
pnpm exec litoho new demo-app
```

### `litoho dev [--root <dir>]`

generate route manifests แล้วรัน development server ผ่าน `tsx server.ts`

ตัวอย่าง:

```bash
pnpm exec litoho dev --root .
```

### `litoho build [--root <dir>]`

generate route manifests แล้ว build app ผ่าน Vite

ตัวอย่าง:

```bash
pnpm exec litoho build --root .
```

### `litoho start [--root <dir>]`

generate route manifests แล้ว start server ในโหมด production โดยส่ง `NODE_ENV=production`

ตัวอย่าง:

```bash
pnpm exec litoho start --root .
```

### `litoho doctor [--root <dir>]`

ตรวจโครงสร้าง app conventions เช่น naming, special pages, middleware, และ route contracts

ตัวอย่าง:

```bash
pnpm exec litoho doctor
```

## Generate Commands

รองรับทั้ง:

- `litoho generate ...`
- `litoho g ...`
- `litoho -g ...`

### `litoho generate routes`

สร้าง generated route manifests จาก `app/pages` และ `app/api`

ตัวอย่าง:

```bash
pnpm exec litoho generate routes
pnpm exec litoho g routes
```

### `litoho generate page <path>`

สร้าง page module ตาม convention `_index.ts`

flags:

- `--params <name[,name2]>`
- `--ssr`
- `--csr`
- `--throw-demo`
- `--template <client-counter|server-data|api-inspector|not-found-demo>`
- `--root <dir>`

aliases:

- `litoho g page ...`
- `litoho g p ...`
- `litoho -g page ...`

ตัวอย่าง:

```bash
pnpm exec litoho g p docs/getting-started
pnpm exec litoho g p products --params id
pnpm exec litoho g p counter-lab --template client-counter
pnpm exec litoho g p server-snapshot --template server-data
pnpm exec litoho g p failure-lab --throw-demo
```

### `litoho generate api <path>`

สร้าง API route ใต้ `app/api`

flags:

- `--params <name[,name2]>`
- `--query <key:type[,key2:type2]>`
- `--root <dir>`

aliases:

- `litoho g api ...`
- `litoho g a ...`
- `litoho -g api ...`

รองรับ query types:

- `string`
- `number`
- `boolean`
- `strings`

ตัวอย่าง:

```bash
pnpm exec litoho g a users --params id
pnpm exec litoho g a products --params id --query q:number,draft:boolean,tag:strings
```

### `litoho generate resource <name>`

สร้าง CRUD resource แบบครบชุดทั้ง pages และ api

flags:

- `--params <name[,name2]>`
- `--root <dir>`

aliases:

- `litoho g resource ...`
- `litoho g r ...`

ตัวอย่าง:

```bash
pnpm exec litoho g r products
pnpm exec litoho g r products --params id
```

### `litoho generate layout <path>`

สร้าง `_layout.ts`

flags:

- `--params <name[,name2]>`
- `--root <dir>`

aliases:

- `litoho g layout ...`
- `litoho g l ...`

ตัวอย่าง:

```bash
pnpm exec litoho g l docs
pnpm exec litoho g l docs --params slug
```

### `litoho generate middleware`

สร้าง `app/api/_middleware.ts`

template ที่รองรับ:

- `basic`
- `logger`
- `auth`
- `timing`
- `cors`
- `rate-limit`

flags:

- `[api|auth|cors|rate-limit|logger|timing|basic]`
- `--template <basic|logger|auth|cors|rate-limit|timing>`
- `--force`
- `--root <dir>`

aliases:

- `litoho g middleware ...`
- `litoho g m ...`

ตัวอย่าง:

```bash
pnpm exec litoho g middleware auth
pnpm exec litoho g m --template logger
pnpm exec litoho g m --template timing --force
```

### `litoho generate middleware-stack <stack>`

สร้าง middleware stack preset

stack ที่รองรับ:

- `web`
- `api`
- `secure-api`
- `browser-app`

flags:

- `--force`
- `--root <dir>`

aliases:

- `litoho g middleware-stack ...`
- `litoho g ms ...`

ตัวอย่าง:

```bash
pnpm exec litoho g ms web
pnpm exec litoho g ms api --force
pnpm exec litoho g ms secure-api --force
pnpm exec litoho g ms browser-app --force
```

### `litoho generate not-found`

สร้าง `app/pages/_not-found.ts`

flags:

- `--force`
- `--root <dir>`

aliases:

- `litoho g not-found`
- `litoho g nf`

ตัวอย่าง:

```bash
pnpm exec litoho g nf
```

### `litoho generate error`

สร้าง `app/pages/_error.ts`

flags:

- `--force`
- `--root <dir>`

aliases:

- `litoho g error`
- `litoho g err`

ตัวอย่าง:

```bash
pnpm exec litoho g err
```

## UI Commands

กลุ่มคำสั่งนี้ใช้กับ `@litoho/ui`

รองรับทั้ง:

- `litoho ui ...`
- `litoho add ui ...`
- `litoho a ui ...`

### `litoho ui list`

แสดงรายการ UI components และ presets ที่ CLI รู้จัก

ตัวอย่าง:

```bash
pnpm exec litoho ui list
```

### `litoho ui info <component|preset>`

แสดง metadata ของ component หรือ preset

ตัวอย่าง:

```bash
pnpm exec litoho ui info dialog
pnpm exec litoho ui info form
```

### `litoho ui add <component...>`

เพิ่ม package imports หรือ local copied components ให้แอป

flags:

- `--copy`
- `--dir <path>`
- `--file <path>`
- `--root <dir>`

behavior:

- ถ้าไม่ใส่ `--copy` จะเพิ่ม imports เช่น `@litoho/ui/button`
- ถ้าใส่ `--copy` จะ copy source files ไปไว้ใน local directory แล้ว import local path ให้
- ถ้าไม่ใส่ `--file` จะเลือกเป้าหมายตามลำดับ:
  - `app/pages/_layout.ts`
  - `app/pages/_index.ts`
  - ถ้าไม่เจอทั้งคู่ จะสร้าง `app/pages/_layout.ts`

presets ที่รองรับตอนนี้:

- `form`
- `overlay`
- `content`
- `navigation`

ตัวอย่าง:

```bash
pnpm exec litoho ui add badge
pnpm exec litoho ui add badge button card
pnpm exec litoho ui add form
pnpm exec litoho ui add overlay --copy
pnpm exec litoho add ui dialog --file app/pages/admin/_layout.ts
```

### `litoho ui diff [component|preset...]`

ตรวจ local copied UI files ใน project

flags:

- `--dir <path>`
- `--root <dir>`

status ที่อาจเจอ:

- `up_to_date`
- `outdated`
- `modified`
- `diverged`
- `legacy`
- `missing`
- `extra`

ความหมายโดยย่อ:

- `up_to_date`: local file ตรงกับ upstream ปัจจุบัน
- `outdated`: local file ยังตรงกับ source เดิมที่ copy มา แต่ upstream เปลี่ยนแล้ว
- `modified`: local file ถูกแก้เอง แต่ upstream เดิมยังเท่าเดิม
- `diverged`: ทั้ง local file และ upstream เปลี่ยน
- `legacy`: local file มีอยู่แต่ยังไม่มี metadata header รุ่นใหม่
- `missing`: CLI คาดว่าควรมีไฟล์นี้ แต่หาไม่เจอ
- `extra`: มีไฟล์ local ที่ไม่อยู่ใน file set ที่คำนวณจาก selection ปัจจุบัน

ตัวอย่าง:

```bash
pnpm exec litoho ui diff
pnpm exec litoho ui diff overlay
```

### `litoho ui upgrade [component|preset...]`

อัปเดต local copied UI files จาก upstream source

flags:

- `--dir <path>`
- `--force`
- `--root <dir>`

behavior:

- ถ้าไฟล์เป็น `outdated` จะอัปเดตได้เลย
- ถ้าไฟล์เป็น `modified` หรือ `diverged` จะ skip ไว้ก่อน
- ใส่ `--force` เพื่อ overwrite local changes

ตัวอย่าง:

```bash
pnpm exec litoho ui upgrade
pnpm exec litoho ui upgrade overlay
pnpm exec litoho ui upgrade overlay --force
```

## Global Flags And Parsing Notes

### `--root <dir>`

ใช้ได้กับคำสั่งส่วนใหญ่ เพื่อระบุ project root ที่ต้องการทำงานด้วย

ตัวอย่าง:

```bash
pnpm exec litoho doctor --root examples/ui-showcase
```

### `--params`

ใช้กับ `generate page`, `generate api`, `generate resource`, และ `generate layout`

รองรับหลายค่าแบบ comma-separated:

```bash
--params id
--params id,postId
```

### `--query`

ใช้กับ `generate api` เพื่อสร้าง typed query schema

ตัวอย่าง:

```bash
--query q:number,draft:boolean,tag:strings
```

### `--template`

ใช้กับ:

- `generate page`
- `generate middleware`

### `--force`

ใช้กับ:

- `generate middleware`
- `generate middleware-stack`
- `generate not-found`
- `generate error`
- `ui upgrade`

## Quick Reference

คำสั่งที่ใช้บ่อย:

```bash
pnpm exec litoho new demo-app
pnpm exec litoho dev --root .
pnpm exec litoho g p docs/getting-started
pnpm exec litoho g a users --params id
pnpm exec litoho g ms secure-api --force
pnpm exec litoho ui list
pnpm exec litoho ui add form
pnpm exec litoho ui add overlay --copy
pnpm exec litoho ui diff
pnpm exec litoho ui upgrade overlay --force
```
