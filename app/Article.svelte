<script >
      import { fade } from 'svelte/transition';
    import { closeModal } from 'svelte-native'
    import { Template } from 'svelte-native/components'
    import { isIOS } from 'tns-core-modules/platform'
    export let item_summary
    let item_detail
    let comments = []
    let webView
    export let showComments = false
    export let loading = false

    function toggle_comments() {
        loading = false;
        showComments = !showComments;
    }

    async function load_comments() {
        loading = true;
        item_detail = await fetch(`https://node-hnapi.herokuapp.com/item/${item_summary.id}`).then(r => r.json()).finally(() => loading = false);
    }

    function *all_comments(comment_tree) {
        for (let comment of comment_tree) {
            yield comment;
            if (comment.comments && !comment.collapsed) {
                yield *all_comments(comment.comments);
            }
        }
    }

    function apply_comments(comment_tree) {
       comments = [...all_comments(comment_tree)]
    }

    function collapse_comment(comment) {
        comment.collapsed = !comment.collapsed;
        apply_comments(item_detail.comments);
    }

    function web_finished(e) {
        if (e.error) {
            console.log("web error:", e.error);
        }
        loading = false;
    }

    function range(count) {
        let range = []
        for (var i = 0; i < count; i++) {
            range.push(i);
        }
        return range;
    }

    function clean_content(content) {
        return '<font color="black">' + content.replace(/<p>/ig, (match, offset) => offset == 0 ? '' : '<br><br>') + '</font>'
    }

    $: if (item_detail && item_detail.comments) {
        apply_comments(item_detail.comments);
    }

    $: if (showComments) load_comments();
</script>

<frame>
    <page>
        <actionBar class="{showComments ? 'comments' : ''}" >
            {#if isIOS }
                <actionItem icon="res://chevron_left" ios.position="left" on:tap="{closeModal}" />
            {:else}
                <navigationButton icon="res://chevron_left" on:tap="{closeModal}"></navigationButton>
            {/if}

            <stackLayout orientation="horizontal">
                <label class="actiontitle {showComments ? 'comments' : ''}" text="{(showComments ? 'Comments' : 'Article')}"
                    on:tap="{toggle_comments}" ></label>
            </stackLayout>

            <actionItem icon="res://message_square" visibility="{ showComments ? 'collapse' : 'visible' }" on:tap={toggle_comments} />
            <actionItem icon="res://file" visibility="{ showComments ? 'visible' : 'collapse' }" on:tap={toggle_comments} />
        </actionBar>
        <gridLayout>
        {#if showComments}
            <listView row="0" col="0" items="{comments}" transition:fade="{{duration: 1000 }}">
                <Template let:item>
                    <stackLayout orientation="horizontal" >
                        {#each range(item.level) as depth}
                            <label width="10" class="thread-level" style="opacity: { (Math.max(0.1, 0.5 - (depth * 0.075))).toString() }"></label>
                        {/each}
                        <stackLayout class="p-10">
                            <stackLayout orientation="horizontal">
                                <label class="comment-user" text="{item.user}" /><label class="comment-ago" text="{item.time_ago}" />
                            </stackLayout>
                            <htmlView html="{clean_content(item.content)}" on:tap="{() => collapse_comment(item)}"></htmlView>
                        </stackLayout>
                    </stackLayout>
                </Template>
            </listView>
        {:else}
            <webView row="0" col="0" src="{item_summary.url}"  bind:this="{webView}"  on:loadStarted="{()=>loading=true}" on:loadFinished="{web_finished}"></webView>
        {/if}
        <activityIndicator busy="{loading}" verticalAlignment="top" horizontalAlignment="right" visibility="{ loading ? 'visible' : 'collapse' }"></activityIndicator>
        </gridLayout>
    </page>
</frame>

<style>
    actionBar {
        background-color: #dddddd;
    }
    actionBar.comments {
        background-color: #ff6600;
    }

    .actiontitle {
        font-size: 20;
        color: #222222;
    }

    activityIndicator {
        width: 24;
        height: 24;
        color: black;
        opacity: 0.2;
        margin: 10;
    }

    .actiontitle.comments {
        color: #FFFFFF;
    }

    .thread-level {
        background-color: #828282;
    }

    .comment-user {
        color: #626262;
        font-size: 13;
        font-weight: bold;
        padding-bottom: 10;
        padding-right: 10;
    }

    .comment-ago {
        color: #828282;
        font-size: 13;
        padding-bottom: 10;
    }

    listView {
        background-color: #f6f6ef;
    }
</style>