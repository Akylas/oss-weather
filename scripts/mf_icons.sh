#!/bin/bash
for i in {1..50}
do
   wget "https://meteofrance.com/modules/custom/mf_tools_common_theme_public/svg/weather/p"$i"j.svg"
   wget "https://meteofrance.com/modules/custom/mf_tools_common_theme_public/svg/weather/p"$i"n.svg"
done