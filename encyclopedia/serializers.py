from rest_framework import serializers
from .models import Role, Hero, Skill

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'

class HeroSerializer(serializers.ModelSerializer):
    # Opsional: Menampilkan detail skill langsung di dalam data Hero (Nested)
    # skills = SkillSerializer(many=True, read_only=True) 
    
    class Meta:
        model = Hero
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'