# Release flow for `(packages/tints-and-shades)`

**Applies only when releasing the npm package.** If `packages/tints-and-shades` isn’t modified, just commit and push to `main`.

1. Commit code changes

    ```bash
    git add .
    git commit -m "describe change"
    ```

2. Bump npm version

    **Working tree must be clean before versioning. Run `git status` first if uncertain.**

    ```bash
    cd packages/tints-and-shades
    npm version patch   # or minor / major
    ```

3. Publish to npm

    ```bash
    npm publish
    ```

4. Commit version bump to GitHub

    **Commit message should match npm version number.**

    ```bash
    cd ../../
    git add package-lock.json packages/tints-and-shades/package.json
    git commit -m "vX.Y.Z"
    ```

5. Create annotated tag

    **Tag should match npm version number.**

    ```bash
    git tag -a vX.Y.Z -m "version summary"
    ```

6. Push everything

    ```bash
    git push
    git push --tags
    ```
