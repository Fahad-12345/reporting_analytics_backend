FROM node:20

# Create a non-root user and switch to it
RUN useradd -m -d /home/nonrootuser -s /bin/bash nonrootuser

WORKDIR /app
COPY package*.json ./
COPY . .
COPY ./build .
RUN npm install
RUN npm install -g db-migrate
RUN npm install -g db-migrate-pg

# Install dependencies for Puppeteer and Chrome
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libappindicator3-1 libasound2 \
    libatk-bridge2.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 \
    libnspr4 libnss3 xdg-utils wget && \
    wget -O google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    apt-get install -y ./google-chrome.deb && \
    rm google-chrome.deb && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Chrome
RUN curl -LO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    apt install -y ./google-chrome-stable_current_amd64.deb && \
    rm google-chrome-stable_current_amd64.deb

# Install AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip

# Switch to the non-root user
USER nonrootuser

EXPOSE 3000
CMD [ "node", "app.js" ]