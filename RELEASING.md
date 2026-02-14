# Release flow for `(packages/tints-and-shades)`

**Applies only when releasing the npm package.** If `packages/tints-and-shades` isn’t modified, just commit and push to `main`.

1. Commit code changes.

    ```bash
    git add .
    git commit -m "describe change"
    ```

2. Verify working tree is clean.

    ```bash
    git status
    ```

    If not clean, return to step 1 and commit your changes before continuing.

3. Bump npm version.

    ```bash
    cd packages/tints-and-shades
    npm version patch   # or minor / major
    ```

4. Publish to npm.

    ```bash
    npm publish
    ```

5. Commit version bump to GitHub.

    _Commit message should match npm version number._

    ```bash
    cd ../../
    git add package-lock.json packages/tints-and-shades/package.json
    git commit -m "vX.Y.Z"
    ```

6. Create annotated tag.

    _Tag should match npm version number._

    ```bash
    git tag -a vX.Y.Z -m "version summary"
    ```

7. Push everything.

    ```bash
    git push
    git push --tags
    ```
