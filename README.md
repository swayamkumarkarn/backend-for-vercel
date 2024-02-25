
## Getting Started

First, run the development server:

```bash
npm run dev
# or
sudo yarn dev
```

Open [http://localhost:3000](http://localhost:8181) with your browser to see the result.


The `/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

Do not forget to start your MongoDB using below command:
----------------

mongod --config /usr/local/etc/mongod.conf



GIT Commands to check-in and check-out
-----------------
Local Repository init
sudo git init
sudo git add .
sudo git commit -m "first commit-RL"
sudo git branch -M main
sudo git remote add origin https://<<YOUR TOKEN>>@github.com/Multiplayr/mp-backend-next.git

sudo git status
sudo git pull origin main
sudo git push -u origin main