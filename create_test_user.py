#!/usr/bin/env python
"""
테스트 계정 생성 스크립트
"""
import os
import sys
import django

# Django 설정
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'DjangoProject.settings')
django.setup()

from django.contrib.auth.models import User


def create_test_user():
    # 테스트 계정 1
    username1 = 'a@gmail.com'
    email1 = 'a@gmail.com'
    password1 = '0000'
    first_name1 = 'hi'

    # 마스터 계정
    username2 = 'aaaa@gmail.com'
    email2 = 'aaaa@gmail.com'
    password2 = '0000'
    first_name2 = 'master'

    users = [
        (username1, email1, password1, first_name1),
        (username2, email2, password2, first_name2),
    ]

    for username, email, password, first_name in users:
        # 이미 존재하는지 확인
        if User.objects.filter(username=username).exists():
            user = User.objects.get(username=username)
            user.set_password(password)
            user.first_name = first_name
            user.email = email
            user.save()
            print(f'기존 계정 업데이트 완료: {user.username}')
        else:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name
            )
            print(f'계정 생성 완료: {user.username}')

        print(f'  - 이메일: {user.email}')
        print(f'  - 이름: {user.first_name}')
        print(f'  - 비밀번호: {password}')
        print()

    # 이미 존재하는지 확인
    if User.objects.filter(username=username).exists():
        user = User.objects.get(username=username)
        user.set_password(password)
        user.first_name = first_name
        user.email = email
        user.save()
        print(f'기존 계정 업데이트 완료: {user.username}')
    else:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name
        )
        print(f'계정 생성 완료: {user.username}')

    print(f'  - 이메일: {user.email}')
    print(f'  - 이름: {user.first_name}')
    print(f'  - 비밀번호: {password}')
    return user


if __name__ == '__main__':
    create_test_user()
