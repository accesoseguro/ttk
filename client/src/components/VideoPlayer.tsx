import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, Pause, Volume2, Settings } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface VideoPlayerProps {
  lessonId: number;
  onBack: () => void;
}

export default function VideoPlayer({ lessonId, onBack }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Queries
  const { data: lesson, isLoading: lessonLoading } = trpc.lessons.getById.useQuery(lessonId);
  const { data: progress } = trpc.lessons.getProgress.useQuery(lessonId);
  const updateProgressMutation = trpc.lessons.updateProgress.useMutation();

  // Sincronizar progresso quando o vídeo termina
  useEffect(() => {
    if (duration > 0 && currentTime > 0) {
      const isCompleted = currentTime >= duration * 0.95; // 95% considerado como completo
      updateProgressMutation.mutate({
        lessonId,
        watchedSeconds: Math.floor(currentTime),
        isCompleted,
      });
    }
  }, [currentTime, duration, lessonId, updateProgressMutation]);

  if (lessonLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Aula no encontrada</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-900 to-black text-white">
          <CardTitle>{lesson.title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Video Container */}
          <div className="relative w-full bg-black rounded-lg overflow-hidden mb-6" style={{ aspectRatio: "16/9" }}>
            <video
              src={lesson.videoUrl}
              className="w-full h-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onEnded={() => setIsPlaying(false)}
              controls
              style={{ maxHeight: "100%" }}
            />
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, "0")}</span>
              <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Description */}
          {lesson.description && (
            <div className="mb-6 p-4 bg-card rounded-lg border border-border">
              <h3 className="font-semibold text-foreground mb-2">Descripción</h3>
              <p className="text-muted-foreground text-sm">{lesson.description}</p>
            </div>
          )}

          {/* Completion Status */}
          {progress?.isCompleted && (
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800 mb-6">
              <p className="text-sm text-green-800 dark:text-green-200">✓ Aula completada</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            <Button onClick={onBack} variant="outline" className="flex-1">
              Volver
            </Button>
            <Button 
              onClick={() => {
                updateProgressMutation.mutate({
                  lessonId,
                  watchedSeconds: Math.floor(currentTime),
                  isCompleted: true,
                });
              }}
              className="flex-1"
            >
              Marcar como Completada
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
