from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RoleViewSet, HeroViewSet, SkillViewSet

# Membuat Router
router = DefaultRouter()
router.register(r'roles', RoleViewSet)   # Akses di /api/roles/
router.register(r'heroes', HeroViewSet)  # Akses di /api/heroes/
router.register(r'skills', SkillViewSet) # Akses di /api/skills/

urlpatterns = [
    path('', include(router.urls)),
]