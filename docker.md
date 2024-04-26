# Docker

## Docker là gì?

### Vấn đề?

Chúng ta có 1 server node.js chạy trên version 10, và ubuntu 18.04. Một ngày đẹp trời chúng ta cần phải bảo trì và thêm chức năng cho nó, điều này đòi hỏi bạn phải cho code chạy ở local để test. Nhưng máy bạn là Ubuntu 22 (hoặc Macos) và không có version Node đó, nên không chạy được.

Điều này đòi hỏi bạn phải cài thêm 1 máy ảo đúng với thông số dự án. Cài xong còn phải setup môi trường rất rườm rà. Những phần mềm hỗ trợ máy ảo phổ biến như VMWare thì khá nặng và tốn tài nguyên.

Đấy chỉ là 1 dự án, nếu nhiều dự án thì còn mệt hơn.

### Giải pháp?

Docker sinh ra để đơn giản hóa quá trình trên.

Docker là nền tảng ảo hóa cho phép đóng gói ứng dụng vào 1 container độc lập với máy chủ. Docker giúp đồng bộ môi trường giữa các máy chủ, giúp chúng ta dễ dàng chuyển đổi giữa các môi trường khác nhau.

Tức là bạn chỉ cần cài docker, không cần cài nhiều máy ảo khác nhau.

Muốn chạy 1 app gì đó thì có 2 cách:

1. Bạn tải source code đó về, build thành image, rồi chạy image đó thành container.
2. Bạn tải image của app đó về, rồi chạy image đó thành container.

## Image vs Container

Docker Image là phần mềm (có thể là app hoặc hệ thống) được đóng gói.

Docker Container là một instance của Docker Image. Một Docker Image có thể tạo ra nhiều Docker Container.

Hãy tưởng tượng chúng ta cài Chrome để lướt web. Muốn cài Chrome thì tải file đóng gói `chrome.exe` về và cài đặt. Sau khi cài đặt xong chúng ta có được shortcut Chrome trên desktop. Click vào shortcut này để chạy Chrome lướt web. Khi đó Chrome đang chạy là một instance của `chrome.exe`. Muốn có một instance khác thì chúng ta không cần cài lại mà chỉ cần tạo một profile mới là được.

Vậy ở đây `chrome.exe` là Docker Image, Profile Chrome đang chạy là Docker Container, và profile khác là một Docker Container khác.

## Lệnh docker

### Thông tin docker

```bash
docker version
```

### Show các image

```bash
docker image ls
```

### Xóa image

```bash
docker image rm HASH
```

### Show các container đang chạy (thêm `-a` để show luôn bị dừng)

```bash
docker container ls
# hoặc cái này cũng được
docker ps
```

### Dừng container

```bash
docker container stop HASH
```

### Xóa container

```bash
docker container rm HASH
```

### Build Image từ `Dockerfile`. `duoc/nodejs:v2` là tên image, đặt tên theo cú pháp `USERNAME/TÊN_IMAGE:TAG`

```bash
docker build --progress=plain -t duoc/nodejs:v2 -f Dockerfile.dev .
```

Nếu muốn chỉ định file `Dockerfile` nào đó thì thêm `-f` và đường dẫn tới file đó.

Thi thoảng sẽ có thể gặp lỗi do cache, vậy thì thêm `--no-cache` vào

```bash
docker build --progress=plain -t dev/twitter:v2 -f Dockerfile.dev .
```

### Tạo và chạy container dựa trên image

```bash
docker container run -dp PORT_NGOAI:PORT_TRONG_DOCKER TEN_IMAGE
```

ví dụ

```bash
docker container run -dp 4000:4000 dev/twitter:v2
```

Nếu muốn mapping folder trong container và folder ở ngoài thì thêm `-v`. Cái này gọi là volume.

```bash
docker container run -dp 4000:4000 -v ~/Documents/DuocEdu/NodeJs-Super/Twitter/uploads:/app/uploads dev/twitter:v2
```

### Show log của container

```bash
docker logs -f HASH_CONTAINER
```

### Truy cập vào terminal của container

```bash
docker exec -it HASH_CONTAINER sh
```

Muốn thoát ra thì gõ `exit`

### Để chạy các câu lệnh trong `docker-compose.yml` thì dùng lệnh. Đôi khi cache lỗi thì thêm `--force-recreate --build`

```bash
docker-compose up
```

## Lệnh khác

Dừng và xóa hết tất cả container đang chạy

```bash
docker stop $(docker ps -aq) && docker rm $(docker ps -aq)
```

Thêm chế độ tự động khởi động lại container khi reboot server. Trong trường hợp đã có container từ trước thì dùng

```bash
docker update --restart unless-stopped HASH_CONTAINER
```

Còn chưa có container thì thêm vào câu lệnh `docker run` option là `--restart unless-stopped`

```bash
docker run -dp 3000:3000 --name twitter-clone --restart unless-stopped -v ~/twitter-clone/uploads:/app/uploads duthanhduoc/twitter:v4
```


# Cẩm nang CI/CD cơ bản

Flow cơ bản làm việc với CI/CD

Code ở dưới local push lên Github -> Github action sẽ tiến hành build image và đẩy image lên docker hub -> Server sẽ kéo image từ docker hub về và chạy

## 1. Đăng ký tài khoản trên docker hub

### Đăng nhập docker hub trên terminal

```bash
docker login
```

Hoặc đăng nhập nhanh bằng cách

```bash
docker login -u <username> -p <password>
```

### Đẩy image lên docker hub

Đối với image khác tên

```bash
docker tag local-image:tagname new-repo:tagname
docker push new-repo:tagname
```

### Kéo image về local

```bash
docker pull new-repo:tagname
```

> Image mà được build ở mỗi máy tính sẽ có sự khác nhau. Có thể sẽ không chạy được trên máy khác.
> Ví dụ: Image được build trên máy Macbook M2 dùng chip **ARM**, sẽ không chạy được trên máy ubuntu dùng chip **Intel (hoặc AMD)**

## 2. Docker compose

## 3. Github action

Tạo file `.github/workflows/docker-image.yml`

Nội dung tương tự như sau

```yaml
name: Docker Image CI

on:
  push:
    branches: ['main']
  pull_request:
    branches: ['main']

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./Twitter
    steps:
      - uses: actions/checkout@v3
      - name: 'Create env file'
        run: echo "${{ secrets.TWITTER_ENV_PRODUCTION }}" > .env.production
      - name: Build the Docker image
        run: docker build --progress=plain -t duthanhduoc/twitter:v4 .
      - name: Log in to Docker Hub
        run: docker login -u ${{ secrets.DOCKERHUB_USERNAME }} -p ${{ secrets.DOCKERHUB_PASSWORD }}
      - name: Push the Docker image
        run: docker push duthanhduoc/twitter:v4
```

Muôn tên image động thì cập nhật lại 1 tí như ở phía dưới

```yaml
name: Docker Image CI

on:
  push:
    branches: ['main']
  pull_request:
    branches: ['main']

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./Twitter
    steps:
      - uses: actions/checkout@v3
      - name: 'Create env file'
        run: echo "${{ secrets.TWITTER_ENV_PRODUCTION }}" > .env.production
      - name: Build the Docker image
        run: |
          IMAGE_TAG=duthanhduoc/twitter:$(date +%s)
          docker build . --file Dockerfile --tag $IMAGE_TAG
          echo "::set-output name=image_tag::$IMAGE_TAG"
        id: build
      - name: Log in to Docker Hub
        run: docker login -u ${{ secrets.DOCKERHUB_USERNAME }} -p ${{ secrets.DOCKERHUB_PASSWORD }}
      - name: Push Docker image to Docker Hub
        run: docker push ${{ steps.build.outputs.image_tag }}
```

## 4. Setup VPS

### Cài docker trên ubuntu server

[Cài đặt docker trên ubuntu](https://docs.docker.com/engine/install/ubuntu/)

Fix lỗi trên ubuntu server

[Lỗi khi gõ `docker version` thì click vào đây](https://docs.docker.com/engine/install/linux-postinstall/)

### Để ssh vào server

```bash
ssh -i ~/.ssh/id_duthanhduoc duoc@207.148.118.147
```
