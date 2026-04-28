# npm package release flow

This document applies only when releasing the npm package at `packages/tints-and-shades`.

## When a release is required

Publish a new npm version when the changes should ship to npm consumers. This usually means changes to:

- `packages/tints-and-shades/src/*`
- `packages/tints-and-shades/package.json`
- anything else that changes the built output in `packages/tints-and-shades/dist`

You usually do not need a release for package-internal changes that do not affect what npm consumers receive, such as:

- `packages/tints-and-shades/test/*`
- tooling or config changes
- README changes, unless you want the npm package documentation updated

If no npm release is needed, just commit and push to `main`.

## Release steps

1. Commit code changes.

    ```bash
    git add -A
    git commit -m "describe change"
    ```

2. Verify working tree is clean.

    ```bash
    git status
    ```

    If not clean, return to step 1 and commit your changes before continuing.

3. Verify release tests pass.

    ```bash
    npm run test:api
    npm run test:app
    ```

4. Bump npm version.

    ```bash
    cd packages/tints-and-shades
    npm version patch   # or minor / major
    ```

    _At this step, the only files changed should be `package-lock.json` and `packages/tints-and-shades/package.json`._

5. Publish to npm.

    ```bash
    npm publish
    ```

6. Commit version bump to GitHub.

    _Commit message should match npm version number._

    ```bash
    cd ../../
    git add -A
    git commit -m "vX.Y.Z"
    ```

7. Create annotated tag.

    _Tag should match npm version number._

    ```bash
    git tag -a vX.Y.Z -m "~60-character version summary"
    ```

8. Push everything.

    ```bash
    git push
    git push --tags
    ```
