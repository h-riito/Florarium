# Source Han Sans CN web fonts

This directory contains source OTF binaries from Adobe's official Source Han Sans 2.005R release:

- `source-han-sans-cn-regular.otf`
- `source-han-sans-cn-medium.otf`
- `source-han-sans-cn-bold.otf`

The matching `.woff2` files are full-font web conversions. They retain all glyphs and cmap
entries from their OTF sources; no character subsetting is applied. The build publishes the
WOFF2 files and keeps the OTF sources out of the site artifact.

Upstream release: https://github.com/adobe-fonts/source-han-sans/releases/tag/2.005R

The files are redistributed under the SIL Open Font License 1.1. See `OFL-SourceHanSans.txt` in this directory.

## Roboto Flex garden art instance

`roboto-flex-garden-art.woff2` is a static Basic Latin web subset derived from Roboto Flex 3.200.
All variation axes are pinned to the values used by the home-page card decoration:

`opsz=14, wght=600, GRAD=105, wdth=151, slnt=0, XOPQ=91, YOPQ=64, XTRA=482, YTUC=671, YTLC=472, YTAS=681, YTDE=-226, YTFI=663`.

Roboto Flex is redistributed under the SIL Open Font License 1.1. See `OFL-RobotoFlex.txt`.
