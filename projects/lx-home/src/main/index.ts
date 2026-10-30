import { registerResourceAction } from './shared/hostAPI'
import { sources, wholeListSources } from './sources'
import {
  paginate,
  toMusicInfoOnline,
  toSongListItem,
  toSonglistTagResult,
  toSongListDetailInfo,
  toTagItem,
} from './adapter'

const getSource = (source: string) => {
  const sourceModule = (sources as Record<string, any>)[source]
  if (!sourceModule) throw new Error(`unknown source: ${source}`)
  return sourceModule
}

const buildSearchText = (name: string, artist?: string) => `${name ?? ''} ${artist ?? ''}`.trim()

const toListResult = <T>(
  list: T[],
  raw: { total: number; page: number; limit: number },
  page: number,
  limit?: number,
) => ({
  list,
  total: raw.total ?? list.length,
  page: raw.page ?? page,
  limit: raw.limit ?? limit,
})

export const registerResourceActions = () => {
  const actions: Partial<AnyListen_API.ResourceAction> = {
    async tipSearch(params: TipSearchParams) {
      const source = getSource(params.source)
      return source.tipSearch.search(params.keyword)
    },

    async hotSearch(params: CommonParams) {
      const source = getSource(params.source)
      const result = await source.hotSearch.getList()
      return result.list as string[]
    },

    async musicSearch(params: MusicSearchParams) {
      const source = getSource(params.source)
      const result = await source.musicSearch.search(
        buildSearchText(params.name, params.artist),
        params.page,
        params.limit,
      )
      return toListResult(
        result.list.map((item: any) => toMusicInfoOnline(item, params.source)),
        result,
        params.page,
        params.limit,
      )
    },

    async songlistSearch(params: CommonSearchParams) {
      const source = getSource(params.source)
      const result = await source.songList.search(params.keyword, params.page, params.limit)
      return toListResult(result.list.map(toSongListItem), result, params.page, params.limit)
    },

    async songlistSorts(params: CommonParams) {
      const source = getSource(params.source)
      return source.songList.sortList.map(toTagItem)
    },

    async songlistTags(params: CommonParams) {
      const source = getSource(params.source)
      const result = await source.songList.getTags()
      return toSonglistTagResult(result)
    },

    async songlist(params: SonglistListParams) {
      const source = getSource(params.source)
      const result = await source.songList.getList(params.sort, params.tag, params.page)
      return toListResult(result.list.map(toSongListItem), result, params.page, params.limit)
    },

    async songlistDetail(params: ListDetailParams) {
      const source = getSource(params.source)
      const result = await source.songList.getListDetail(params.id, params.page)
      let list = result.list.map(toSongListItem)
      if (wholeListSources[params.source]) {
        list = paginate(list, params.page, params.limit)
      }
      return {
        info: toSongListDetailInfo(result.info),
        list,
        total: result.total ?? result.list.length,
        page: params.page,
        limit: params.limit ?? result.limit,
      }
    },

    async topSongs(params: CommonParams) {
      const source = getSource(params.source)
      const result = await source.leaderboard.getBoards()
      return result.list.map((item: any) => ({
        id: String(item.id),
        name: String(item.name ?? ''),
      }))
    },

    async topSongsDetail(params: TopSongsDetailParams) {
      const sourceModule = getSource(params.source)
      // 榜单 id 为 {source}__{bangid} 格式，各源 getList 需要裸 bangid
      const bangId = params.id.replace(`${params.source}__`, '')
      const result = await sourceModule.leaderboard.getList(bangId, params.page)
      let list = result.list.map((item: any) => toMusicInfoOnline(item, params.source))
      let info: AnyListen_API.TopSongsDetailInfo = { name: '' }
      if (wholeListSources[params.source]) {
        info.name = sourceModule.leaderboard.list.find(
          (board: any) => String(board.id) === String(params.id),
        )?.name ?? ''
        list = paginate(list, params.page, params.limit)
      }
      return {
        info,
        list,
        total: result.total ?? result.list.length,
        page: params.page,
        limit: params.limit ?? result.limit,
      }
    },
  }

  registerResourceAction(actions)
}

registerResourceActions()
