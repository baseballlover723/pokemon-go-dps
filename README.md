
## Pokemon GO DPS Optimizer

### How you can contribute:

1. Fork the project by using the 'Fork' button in the upper right corner
2. Get the project working on you fork (See getting started guide)
3. Make a new branch for your feature

        git remote add upstream https://github.com/baseballlover723
        git checkout -b name-of-your-feature

4. Make changes to the code on the branch you just created, making sure to follow the style conventions that I use (include automated tests as a bonus!).

 Note: please use ES6 features when possible when working of server side code, and ***DO NOT*** use ES6 on client side code, as not all browsers support ES6 yet.

5. Once your done, make sure that your feature works and doesn't break any other features
6. Add and commit your code, then merge master back into your branch, resolving any conflicts and condensing the number of commits to a reasonable amount (usually 1)

        git add .
        git commit -m "a short description of your commit"
        git fetch upstream
        git rebase -i upstream/master

7. Make a pull request to my repository from your forked repository
8. Send me an email at [baseballlover723@gmail.com](mailto:baseballlover723@gmail.com?subject=Pokémon%20GO%20DPS%20Optimizer%20Pull%Request) to let me know that you created a pull request
9. Address any feedback, emailing me once your done, repeating until I'm satisfied.
10. I merge your pull request and update the server, putting your name in next to the feature you did!

### Getting Started:

Note: I developed this using Git, NPM, Node.js, and datatables.js in a windows powershell enviorment. If you are on another OS, everything should work since everything is cross-platform, but its possible that you might have some trouble setting up this project, and I probably won't be able to help you fix it.

1. Make sure you have the right software installed (Git, NPM, and Node.js). The version numbers shouldn't be too important as long as they're close

        git  --version # git version 2.5.0.windows.1 (differs based on OS)
        npm -v # 3.10.7
        node -v # v6.1.0
        mysql # Server version: 5.6.21 MySQL Community Server (GPL)
        exit;

2. Clone the repository (or your forked version)

        git clone git@github.com:baseballlover723/pokemon-go-dps.git

3. Install all the dependencies

        npm install

4. ~~Set up the database~~ (not implemented yet)

        sequelize db:migrate
        sequelize db:seed:all

5. Start the server (you should see the message "server is now running" if it started successfully) (the first time you run this, it may start printng out logs as it initially populates its data)

        npm start

6. Go to [localhost:3000/](localhost:3000/) and you should see the website running. (Behavior might be a bit funky for a few minutes after the first start while its populating its data for the first time. So if it doesn't work at first, make sure its loaded all of its data, `npm start` should print out something like this if its loaded all of its data.

        read cached moves
        no moves are loading
        cached valid
