from django.db import models

# Tabel 1: Role (Kategori Hero)
class Role(models.Model):
    nama = models.CharField(max_length=50) # Misal: Tank, Mage
    deskripsi = models.TextField()

    def __str__(self):
        return self.nama

# Tabel 2: Hero (Berelasi ke Role)
class Hero(models.Model):
    # Relasi: Satu Role bisa punya banyak Hero
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='heroes')
    nama = models.CharField(max_length=100)
    lore = models.TextField(verbose_name="Cerita Hero")
    hp_base = models.IntegerField(verbose_name="Health Point Dasar")

    def __str__(self):
        return f"{self.nama} ({self.role.nama})"

# Tabel 3: Skill (Berelasi ke Hero)
class Skill(models.Model):
    # Relasi: Satu Hero bisa punya banyak Skill
    hero = models.ForeignKey(Hero, on_delete=models.CASCADE, related_name='skills')
    nama_skill = models.CharField(max_length=100)
    damage = models.IntegerField()
    cooldown = models.IntegerField(help_text="Dalam detik")

    def __str__(self):
        return f"{self.nama_skill} milik {self.hero.nama}"