# wasp-webapp

## Cloning

Decide where you want to set everything up and clone the repository with it's submodules:

```bash
git clone --recurse-submodules https://github.com/WaspScripts/wasp-webapp
```

This will clone both this repository and [wasp-info](https://github.com/WaspScripts/wasp-info) where all markdown files are stored.

## Developing

Once you've cloned the project and installed dependencies with `pnpm install`, start a development server:

```bash
pnpm dev
```

## Building

To create a production version of your app:

```bash
pnpm build
```

You can preview the production build with `pnpm preview`.
