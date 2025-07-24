from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages

# Create your views here.

# def Login_view(request):
#     if request.method == 'POST':
#         pass
#     else:
#         return render(request,"Login.html")
    
def Login_view(request):
    if request.method == 'POST':
        username = request.POST.get("username")
        password = request.POST.get("password")
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, "Invalid username or password")
            return render(request, "Login.html", context={"username": username,"password": password})
    return render(request, "Login.html")

# def Register_view(request):
#     if request.method == 'POST':
#         pass
#     else:
#         return render(request,"Register.html")


def Register_view(request):
    if request.method == 'POST':
        username = request.POST.get("username")
        email = request.POST.get("email")
        password = request.POST.get("password")
        confirm_password = request.POST.get("confirm_password")

        if password != confirm_password:
            messages.error(request, "Passwords do not match")
            return render(request, "Register.html", context={
                "username": username,
                "email": email  
            })

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
            return redirect('register')

        user = User.objects.create_user(username=username, email=email, password=password)
        login(request, user)
        return redirect('home')

    return render(request, "Register.html")

def Logout_view(request):
    logout(request)
    return redirect('login')
