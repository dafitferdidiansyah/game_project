from django.contrib import admin

from .models import Role, Hero, Skill

# Daftarkan model agar muncul di halaman admin
admin.site.register(Role)
admin.site.register(Hero)
admin.site.register(Skill)