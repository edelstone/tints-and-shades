# API release flow

**Applies only when releasing the npm package.** If `packages/tints-and-shades` isn’t modified, just commit and push to `main`.

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

3. Verify API package tests pass.

    ```bash
    npm run test:api
    ```

4. Bump npm version.

    ```bash
    cd packages/tints-and-shades
    npm version patch   # or minor / major
    ```

    _The only files changed should be `package-lock.json` and `packages/tints-and-shades/package.json`._

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
    git tag -a vX.Y.Z -m "version summary"
    ```

8. Push everything.

    ```bash
    git push
    git push --tags
    ```
