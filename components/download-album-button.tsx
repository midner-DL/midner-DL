import React, { useEffect, useState } from 'react'
import { Button, ButtonProps } from './ui/button'
import { DownloadIcon, FileArchiveIcon, MusicIcon } from 'lucide-react'
import { StatusBarProps } from './status-bar/status-bar'
import { FFmpegType } from '@/lib/ffmpeg-functions'
import { SettingsProps } from '@/lib/settings-provider'
import { FetchedQobuzAlbum, formatTitle, getFullAlbumInfo, QobuzAlbum, QobuzPlaylist, getType } from '@/lib/qobuz-dl'
import axios from 'axios'
import { createDownloadJob } from '@/lib/download-job'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'

export interface DownloadAlbumButtonProps extends ButtonProps {
    result: QobuzAlbum | QobuzPlaylist,
    setStatusBar: React.Dispatch<React.SetStateAction<StatusBarProps>>,
    ffmpegState: FFmpegType,
    settings: SettingsProps,
    fetchedAlbumData: FetchedQobuzAlbum | null,
    setFetchedAlbumData: React.Dispatch<React.SetStateAction<FetchedQobuzAlbum | null>>,
    onOpen?: () => void,
    onClose?: () => void,
    toast: (toast: any) => void,
}

const DownloadButton = React.forwardRef<HTMLButtonElement, DownloadAlbumButtonProps>(
    ({ className, variant, size, asChild = false, onOpen, onClose, result, setStatusBar, ffmpegState, settings, toast, fetchedAlbumData, setFetchedAlbumData, ...props }, ref) => {
        const [open, setOpen] = useState(false);
        useEffect(() => {
            if (open) onOpen?.()
            else onClose?.()
        })
        return (
            <>
                <DropdownMenu open={open} onOpenChange={setOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            className={className}
                            ref={ref}
                            variant={variant}
                            size={size}
                            asChild={asChild}
                            {...props}
                        >
                            <DownloadIcon className='!size-4' />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {getType(result) !== "playlists" && (
                            <DropdownMenuItem onClick={() => {
                                createDownloadJob(result as QobuzAlbum, setStatusBar, ffmpegState, settings, toast, fetchedAlbumData, setFetchedAlbumData)
                                toast({ title: `Added '${formatTitle(result)}'`, description: "The album has been added to the queue" })
                            }} className='flex items-center gap-2'>
                                <FileArchiveIcon className='!size-4' />
                                <p>ZIP Archive</p>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={async () => {
                            if (getType(result) === "playlists") {
                                // Handle playlist download
                                const playlistResponse = await axios.get("/api/get-playlist", { params: { playlist_id: (result as QobuzPlaylist).id } });
                                const playlistData = playlistResponse.data.data;
                                for (const track of playlistData.tracks.items) {
                                    if (track.streamable) {
                                        await createDownloadJob(track, setStatusBar, ffmpegState, settings, toast);
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                    }
                                }
                                toast({ title: `Added '${formatTitle(result)}'`, description: "All tracks from the playlist have been added to the queue" })
                            } else {
                                // Handle album download
                                const albumData = await getFullAlbumInfo(fetchedAlbumData, setFetchedAlbumData, result as QobuzAlbum);
                                for (const track of albumData.tracks.items) {
                                    if (track.streamable) {
                                        await createDownloadJob({ ...track, album: albumData }, setStatusBar, ffmpegState, settings, toast, albumData, setFetchedAlbumData);
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                    }
                                }
                                toast({ title: `Added '${formatTitle(result)}'`, description: "The album has been added to the queue" })
                            }
                        }} className='flex items-center gap-2'>
                            <MusicIcon className='!size-4' />
                            <p>{getType(result) === "playlists" ? "Download All Tracks" : "No ZIP Archive"}</p>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </>
        )
    }
)
DownloadButton.displayName = "DownloadAlbumButton";

export default DownloadButton
