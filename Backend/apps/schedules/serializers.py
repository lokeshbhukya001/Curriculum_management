from rest_framework import serializers
from .models import Schedule

class ScheduleSerializer(serializers.ModelSerializer):
    course_name = serializers.ReadOnlyField(source='course.title')
    teacher_name = serializers.ReadOnlyField(source='teacher.username')

    class Meta:
        model = Schedule
        fields = '__all__'
        read_only_fields = ('teacher',)

    def validate(self, data):
        date = data.get('date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        
        if self.instance:
            date = date or self.instance.date
            start_time = start_time or self.instance.start_time
            end_time = end_time or self.instance.end_time

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("Start time must be before end time.")

        if date and start_time and end_time:
            conflicts = Schedule.objects.filter(
                date=date,
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            
            if self.instance:
                conflicts = conflicts.exclude(pk=self.instance.pk)
                
            if conflicts.exists():
                raise serializers.ValidationError("This schedule overlaps with an existing session.")
                
        return data
