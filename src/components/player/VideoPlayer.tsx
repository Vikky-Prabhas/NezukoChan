import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { useRef, useEffect } from "react";
import {
    MediaPlayer,
    MediaProvider,
    Track,
    Menu,
    Tooltip,
    useVideoQualityOptions,
    usePlaybackRateOptions,
    useCaptionOptions,
    useAudioOptions,
    type MediaPlayerInstance
} from "@vidstack/react";
import { defaultLayoutIcons, DefaultVideoLayout } from "@vidstack/react/player/layouts/default";
import { Settings as SettingsIcon, ChevronRight as ChevronRightIcon, Check } from "lucide-react";

interface SubtitleTrack {
    label: string;
    file: string;
    kind: string;
}

interface VideoPlayerProps {
    src: string;
    poster?: string;
    title?: string;
    subtitles?: SubtitleTrack[];
    selectedAudioTrack?: string | null;
    audioTracks?: string[];
    isHLS?: boolean; // Explicitly passed from backend
    onEnded?: () => void;
    onError?: () => void; // Fired when stream fails (for smart fallback)
    onTimeUpdate?: (currentTime: number) => void; // Track playback position
    initialTime?: number; // Seek to this time on load (for server switch continuity)
}

export default function VideoPlayer({ src, poster, title, subtitles = [], selectedAudioTrack, isHLS: propsIsHLS, onEnded, onError, onTimeUpdate, initialTime }: VideoPlayerProps) {
    const player = useRef<MediaPlayerInstance>(null);

    // Use explicit prop if available, otherwise guess
    const isHLS = propsIsHLS !== undefined
        ? propsIsHLS
        : (src.includes('.m3u8') || src.includes('m3u8'));

    const source = isHLS
        ? { src, type: 'application/x-mpegurl' as const }
        : src;

    useEffect(() => {
        if (player.current && selectedAudioTrack) {
            const tracks = player.current.audioTracks;
            const match = Array.from(tracks).find(t =>
                (t?.label && t.label.toLowerCase() === selectedAudioTrack.toLowerCase()) ||
                (t?.language && t.language.toLowerCase() === selectedAudioTrack.toLowerCase())
            );

            if (match) {
                console.log(`[VideoPlayer] Switching audio to: ${match.label}`);
                match.selected = true;
            }
        }
    }, [selectedAudioTrack, src]);

    // Seek to initialTime when stream loads (for server switch continuity)
    useEffect(() => {
        if (player.current && initialTime && initialTime > 0) {
            const handleCanPlay = () => {
                if (player.current && initialTime > 0) {
                    console.log(`[VideoPlayer] Seeking to saved position: ${initialTime.toFixed(1)}s`);
                    player.current.currentTime = initialTime;
                }
            };
            player.current.addEventListener('can-play', handleCanPlay, { once: true });
            return () => {
                player.current?.removeEventListener('can-play', handleCanPlay);
            };
        }
    }, [src, initialTime]);

    return (
        <div className="w-full h-full bg-black overflow-hidden relative">
            <MediaPlayer
                ref={player}
                src={source}
                title={title}
                viewType="video"
                streamType="on-demand"
                logLevel="warn"
                crossOrigin="anonymous"
                playsInline
                className="w-full h-full"
                onEnded={onEnded}
                onError={onError}
                onTimeUpdate={onTimeUpdate ? (e: any) => onTimeUpdate(e.currentTime) : undefined}
            >
                <MediaProvider>
                    {poster && (
                        <img
                            className="vds-poster"
                            src={poster}
                            alt={title}
                        />
                    )}
                    {subtitles.map((track, index) => (
                        <Track
                            key={`${track.kind}-${track.label}-${index}`}
                            src={track.file}
                            kind={track.kind as any}
                            label={track.label}
                            lang={track.label.toLowerCase().slice(0, 2)}
                            default={index === 0 && track.label.toLowerCase().includes("english")}
                        />
                    ))}
                </MediaProvider>
                <DefaultVideoLayout
                    icons={defaultLayoutIcons}
                    slots={{
                        settingsMenu: <SettingsMenu />,
                    }}
                />
            </MediaPlayer>
        </div>
    );
}

function SettingsMenu() {
    return (
        <Menu.Root className="vds-menu">
            <Tooltip.Root>
                <Tooltip.Trigger asChild>
                    <Menu.Button className="vds-menu-button vds-button">
                        <SettingsIcon className="vds-icon" />
                    </Menu.Button>
                </Tooltip.Trigger>
                <Tooltip.Content className="vds-tooltip-content" placement="top">Settings</Tooltip.Content>
            </Tooltip.Root>
            <Menu.Content className="vds-menu-items" placement="top" offset={12}>
                <SpeedSubmenu />
                <QualitySubmenu />
                <CaptionsSubmenu />
                <AudioSubmenu />
            </Menu.Content>
        </Menu.Root>
    );
}

function SpeedSubmenu() {
    const options = usePlaybackRateOptions();
    const hint = options.find(o => o.selected)?.label || "Normal";

    return (
        <Menu.Root>
            <Menu.Button className="vds-menu-item">
                <span className="vds-menu-item-label">Playback Speed</span>
                <span className="vds-menu-item-hint">{hint}</span>
                <ChevronRightIcon className="vds-menu-item-chevron" />
            </Menu.Button>
            <Menu.Content className="vds-menu-items">
                <Menu.RadioGroup value={options.find(o => o.selected)?.value || "1"}>
                    {options.map(option => (
                        <Menu.Radio className="vds-menu-item" key={option.value} value={option.value} onSelect={option.select}>
                            <Check className={`vds-menu-item-icon ${option.selected ? '' : 'invisible'}`} />
                            <span className="vds-menu-item-label">{option.label}</span>
                        </Menu.Radio>
                    ))}
                </Menu.RadioGroup>
            </Menu.Content>
        </Menu.Root>
    );
}

function QualitySubmenu() {
    const options = useVideoQualityOptions({ auto: true, sort: 'descending' });
    const current = options.find(o => o.selected);
    const hint = current?.label || "Auto";


    if (options.length <= 1) return null; // Hide if no quality options

    return (
        <Menu.Root>
            <Menu.Button className="vds-menu-item">
                <span className="vds-menu-item-label">Quality</span>
                <span className="vds-menu-item-hint">{hint}</span>
                <ChevronRightIcon className="vds-menu-item-chevron" />
            </Menu.Button>
            <Menu.Content className="vds-menu-items">
                <Menu.RadioGroup value={options.find(o => o.selected)?.value || "auto"}>
                    {options.map(option => (
                        <Menu.Radio className="vds-menu-item" key={option.value} value={option.value} onSelect={option.select}>
                            <Check className={`vds-menu-item-icon ${option.selected ? '' : 'invisible'}`} />
                            <span className="vds-menu-item-label">{option.label}</span>
                            {option.bitrateText && <span className="vds-menu-item-hint">{option.bitrateText}</span>}
                        </Menu.Radio>
                    ))}
                </Menu.RadioGroup>
            </Menu.Content>
        </Menu.Root>
    );
}

function CaptionsSubmenu() {
    const options = useCaptionOptions();
    const hint = options.find(o => o.selected)?.label || "Off";


    if (options.length <= 1) return null;

    return (
        <Menu.Root>
            <Menu.Button className="vds-menu-item">
                <span className="vds-menu-item-label">Captions</span>
                <span className="vds-menu-item-hint">{hint}</span>
                <ChevronRightIcon className="vds-menu-item-chevron" />
            </Menu.Button>
            <Menu.Content className="vds-menu-items">
                <Menu.RadioGroup value={options.find(o => o.selected)?.value || "off"}>
                    {options.map(option => (
                        <Menu.Radio className="vds-menu-item" key={option.value} value={option.value} onSelect={option.select}>
                            <Check className={`vds-menu-item-icon ${option.selected ? '' : 'invisible'}`} />
                            <span className="vds-menu-item-label">{option.label}</span>
                        </Menu.Radio>
                    ))}
                </Menu.RadioGroup>
            </Menu.Content>
        </Menu.Root>
    );
}

function AudioSubmenu() {
    const options = useAudioOptions();
    const hint = options.find(o => o.selected)?.label || "Default";


    if (options.length <= 1) return null;

    return (
        <Menu.Root>
            <Menu.Button className="vds-menu-item">
                <span className="vds-menu-item-label">Audio</span>
                <span className="vds-menu-item-hint">{hint}</span>
                <ChevronRightIcon className="vds-menu-item-chevron" />
            </Menu.Button>
            <Menu.Content className="vds-menu-items">
                <Menu.RadioGroup value={options.find(o => o.selected)?.value || "default"}>
                    {options.map(option => (
                        <Menu.Radio className="vds-menu-item" key={option.value} value={option.value} onSelect={option.select}>
                            <Check className={`vds-menu-item-icon ${option.selected ? '' : 'invisible'}`} />
                            <span className="vds-menu-item-label">{option.label}</span>
                        </Menu.Radio>
                    ))}
                </Menu.RadioGroup>
            </Menu.Content>
        </Menu.Root>
    );
}
