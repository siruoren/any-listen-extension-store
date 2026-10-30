// lxl-music-desktop musicInfo 与 AnyListen MusicInfoOnline 的转换适配
const timestamp = Date.now()

const extraMetaKeys = [
  'albumId',
  'hash',
  'strMediaMid',
  'albumMid',
  'songId',
  'copyrightId',
  'lrcUrl',
  'mrcUrl',
  'trcUrl',
  'singerId',
  'albumPic',
]

export const toMusicInfoOnline = (item: any, source: string): AnyListen_API.MusicInfoOnline => {
  const qualitys: Record<string, { sizeStr: string | null }> = {}
  if (item._types) {
    for (const [quality, info] of Object.entries(item._types as Record<string, any>)) {
      if (!info) continue
      qualitys[quality] = { sizeStr: info.size ?? null }
    }
  }

  const meta: Record<string, unknown> = {
    musicId: String(item.songmid),
    albumName: item.albumName ?? '',
    picUrl: item.img ?? null,
    source,
    createTime: timestamp,
    updateTime: timestamp,
    posTime: timestamp,
    qualitys,
  }
  for (const key of extraMetaKeys) {
    if (item[key] != null) meta[key] = item[key]
  }

  let interval = item.interval
  if (interval === '--/--') interval = null
  else if (interval != null) interval = String(interval)

  return {
    id: `${source}_${item.songmid}`,
    name: String(item.name ?? ''),
    singer: String(item.singer ?? ''),
    interval,
    isLocal: false,
    meta: meta as unknown as AnyListen.Music.MusicInfoMeta_online,
  }
}

export const toSongListItem = (item: any): AnyListen_API.SongListItem => ({
  id: String(item.id),
  name: String(item.name ?? ''),
  play_count: item.play_count != null ? String(item.play_count) : undefined,
  author: item.author,
  time: item.time,
  img: item.img,
  desc: item.desc,
  total: item.total,
})

export const toTagItem = (item: any): AnyListen_API.TagItem => ({
  id: String(item.id),
  name: String(item.name ?? ''),
})

export const toSonglistTagResult = (raw: any): AnyListen_API.SonglistTagResult => ({
  tags: (raw.tags ?? []).map((group: any) => ({
    name: String(group.name ?? ''),
    list: (group.list ?? []).map(toTagItem),
  })),
  hotTags: (raw.hotTag ?? raw.hotTags ?? []).map(toTagItem),
})

export const toSongListDetailInfo = (raw: any): AnyListen_API.SongListDetailInfo => ({
  name: String(raw.name ?? ''),
  img: raw.img,
  desc: raw.desc,
  author: raw.author,
  play_count: raw.play_count != null ? String(raw.play_count) : undefined,
})

export const paginate = (list: any[], page: number, limit?: number) => {
  const _limit = limit && limit > 0 ? limit : 100
  const start = (page - 1) * _limit
  return list.slice(start, start + _limit)
}
