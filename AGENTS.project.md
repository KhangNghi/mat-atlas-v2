# Mat Atlas — project instructions

This is **Mat Atlas**, a Brazilian Jiu-Jitsu mind map. Cocktail / Backbar work does not belong here.

## GitHub sync (required after every change)

Repo: [KhangNghi/mat-atlas](https://github.com/KhangNghi/mat-atlas)  
Remote: `https://github.com/KhangNghi/mat-atlas.git`  
Branch: `main`  
`gh` is authenticated as **KhangNghi**.

Whenever you finish a user-facing change (or they ask to save / ship / sync):

1. `git add` the app files. Never stage `node_modules`, `.vercel`, `screenshots`, `artifacts`, `.grok`, `attachments`, `.env*`, or secrets.
2. If there is nothing to commit and `main` is already pushed, stop.
3. Commit with a short product-facing message (`git commit -m "…"`).
4. `git push origin main`. Do **not** force-push unless recovering a broken first push they asked for.
5. Do not ask the user to push. Do it yourself.

If `.git` or `origin` is missing, re-init and add that remote, then push `main`.

Keep `startup.sh` starting `npm run dev` on `0.0.0.0:8080`. Auth/DB stay OFF unless the user asks for accounts.
