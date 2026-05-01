# CS732 project - Team Giant Pokemon

Welcome to the CS732 project. We look forward to seeing the amazing things you create this semester! This is your team's repository.

Your team members are:
- Khushba Ahmed _(kahm047@aucklanduni.ac.nz)_
- Shardul Mangesh Anagal _(sana691@aucklanduni.ac.nz)_
- Sreelakshmi Gireesh _(sgir748@aucklanduni.ac.nz)_
- Harsh Kumar _(hkmu884@aucklanduni.ac.nz)_
- Marvin Xu _(zxu734@aucklanduni.ac.nz)_
- Chao Yao _(cyao907@aucklanduni.ac.nz)_

You have complete control over how you run this repo. All your members will have admin access. The only thing setup by default is branch protections on `main`, requiring a PR with at least one code reviewer to modify `main` rather than direct pushes.

Please use good version control practices, such as feature branching, both to make it easier for markers to see your group's history and to lower the chances of you tripping over each other during development

![](./Giant%20Pokemon.png)

## Docker

This project can run as a production-style Docker container with MongoDB via
Docker Compose.

```bash
docker compose up --build
```

Then open http://localhost:3000.

The Compose setup provides `MONGODB_URI=mongodb://mongo:27017/taskflow` to the
app container and persists MongoDB data in the `mongo-data` volume. MongoDB is
kept on Docker's internal network, so it will not conflict with a local MongoDB
already using port 27017.

Useful commands:

```bash
docker compose down
docker compose down -v
docker compose logs -f app
```

For local development without Docker, copy `.env.example` to `.env.local` and
adjust `MONGODB_URI` if needed.
